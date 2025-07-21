
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Product {
  name: string
  sku: string
  category_name: string
  price: number
  min_price?: number
  max_price?: number
  stock: number
  threshold: number
  description?: string
  barcode?: string
  supplier?: string
  has_serial?: boolean
  serial_numbers?: string
  notes?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Check user permissions
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager', 'inventory_manager'].includes(profile.role)) {
      return new Response('Insufficient permissions', { status: 403, headers: corsHeaders })
    }

    const url = new URL(req.url)
    const operation = url.searchParams.get('operation')

    if (operation === 'export') {
      return await handleExport(supabaseClient)
    } else if (operation === 'import' && req.method === 'POST') {
      return await handleImport(req, supabaseClient)
    } else if (operation === 'template') {
      return await handleTemplate()
    }

    return new Response('Invalid operation', { status: 400, headers: corsHeaders })
  } catch (error) {
    console.error('Error in product-bulk-operations:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleExport(supabaseClient: any) {
  console.log('Starting product export...')
  
  const { data: products, error } = await supabaseClient
    .from('products')
    .select(`
      name,
      sku,
      category:categories(name),
      price,
      min_price,
      max_price,
      stock,
      threshold,
      description,
      barcode,
      supplier,
      has_serial,
      serial_numbers,
      created_at,
      updated_at
    `)
    .order('name')

  if (error) {
    throw new Error(`Export failed: ${error.message}`)
  }

  // Transform data for Excel export
  const exportData = products.map((product: any) => ({
    name: product.name,
    sku: product.sku,
    category_name: product.category?.name || '',
    price: product.price,
    min_price: product.min_price || '',
    max_price: product.max_price || '',
    stock: product.stock,
    threshold: product.threshold,
    description: product.description || '',
    barcode: product.barcode || '',
    supplier: product.supplier || '',
    has_serial: product.has_serial ? 'TRUE' : 'FALSE',
    serial_numbers: product.serial_numbers ? product.serial_numbers.join(',') : '',
    created_at: product.created_at,
    updated_at: product.updated_at
  }))

  // Create Excel workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)
  XLSX.utils.book_append_sheet(wb, ws, 'Products')
  
  const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  
  console.log(`Exported ${products.length} products`)
  
  return new Response(excelBuffer, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="products_export_${new Date().toISOString().split('T')[0]}.xlsx"`
    }
  })
}

async function handleImport(req: Request, supabaseClient: any) {
  console.log('Starting product import...')
  
  const formData = await req.formData()
  const file = formData.get('file') as File
  const importMode = formData.get('mode') as string || 'upsert'
  
  if (!file) {
    throw new Error('No file provided')
  }

  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size exceeds 10MB limit')
  }

  // Read file
  const fileBuffer = await file.arrayBuffer()
  let data: any[]

  try {
    if (file.name.endsWith('.csv')) {
      // Handle CSV
      const csvText = new TextDecoder().decode(fileBuffer)
      const lines = csvText.split('\n')
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      
      data = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          return row
        })
    } else {
      // Handle Excel
      const wb = XLSX.read(fileBuffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      data = XLSX.utils.sheet_to_json(ws)
    }
  } catch (error) {
    throw new Error(`Failed to parse file: ${error.message}`)
  }

  console.log(`Parsed ${data.length} rows from file`)

  // Validate required fields
  const requiredFields = ['name', 'sku', 'category_name', 'price', 'stock', 'threshold']
  const errors: string[] = []
  const validRows: Product[] = []

  // Get categories for mapping
  const { data: categories } = await supabaseClient
    .from('categories')
    .select('id, name')

  const categoryMap = new Map(categories?.map((c: any) => [c.name.toLowerCase(), c.id]) || [])

  // Validate each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowErrors: string[] = []

    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        rowErrors.push(`${field} is required`)
      }
    })

    // Validate data types
    if (row.price && isNaN(Number(row.price))) {
      rowErrors.push('price must be a number')
    }
    if (row.stock && isNaN(Number(row.stock))) {
      rowErrors.push('stock must be a number')
    }
    if (row.threshold && isNaN(Number(row.threshold))) {
      rowErrors.push('threshold must be a number')
    }

    // Validate category
    if (row.category_name && !categoryMap.has(row.category_name.toLowerCase())) {
      rowErrors.push(`category "${row.category_name}" not found`)
    }

    if (rowErrors.length > 0) {
      errors.push(`Row ${i + 2}: ${rowErrors.join(', ')}`)
    } else {
      // Parse serial numbers
      const serialNumbers = row.serial_numbers 
        ? row.serial_numbers.split(',').map((s: string) => s.trim()).filter(Boolean)
        : null

      validRows.push({
        name: String(row.name).trim(),
        sku: String(row.sku).trim(),
        category_name: String(row.category_name).trim(),
        price: Number(row.price),
        min_price: row.min_price ? Number(row.min_price) : undefined,
        max_price: row.max_price ? Number(row.max_price) : undefined,
        stock: Number(row.stock),
        threshold: Number(row.threshold),
        description: row.description ? String(row.description).trim() : undefined,
        barcode: row.barcode ? String(row.barcode).trim() : undefined,
        supplier: row.supplier ? String(row.supplier).trim() : undefined,
        has_serial: row.has_serial === 'TRUE' || row.has_serial === '1' || row.has_serial === true,
        serial_numbers: serialNumbers && serialNumbers.length > 0 ? serialNumbers.join(',') : undefined
      })
    }
  }

  if (errors.length > 0 && validRows.length === 0) {
    return new Response(JSON.stringify({ 
      success: false, 
      errors,
      processed: 0,
      imported: 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Process valid rows
  let imported = 0
  let updated = 0
  const importErrors: string[] = []

  for (const product of validRows) {
    try {
      const categoryId = categoryMap.get(product.category_name.toLowerCase())
      const productData = {
        name: product.name,
        sku: product.sku,
        category_id: categoryId,
        price: product.price,
        min_price: product.min_price || 0,
        max_price: product.max_price || product.price,
        stock: product.stock,
        threshold: product.threshold,
        description: product.description,
        barcode: product.barcode,
        supplier: product.supplier,
        has_serial: product.has_serial || false,
        serial_numbers: product.serial_numbers ? product.serial_numbers.split(',') : null
      }

      if (importMode === 'upsert') {
        const { error } = await supabaseClient
          .from('products')
          .upsert(productData, { onConflict: 'sku' })
        
        if (error) throw error
        imported++
      } else if (importMode === 'insert') {
        const { error } = await supabaseClient
          .from('products')
          .insert(productData)
        
        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            importErrors.push(`SKU ${product.sku} already exists`)
            continue
          }
          throw error
        }
        imported++
      } else if (importMode === 'update') {
        const { error } = await supabaseClient
          .from('products')
          .update(productData)
          .eq('sku', product.sku)
        
        if (error) throw error
        updated++
      }
    } catch (error) {
      importErrors.push(`Failed to import ${product.sku}: ${error.message}`)
    }
  }

  console.log(`Import completed: ${imported} imported, ${updated} updated`)

  return new Response(JSON.stringify({
    success: true,
    processed: validRows.length,
    imported: imported + updated,
    errors: [...errors, ...importErrors].slice(0, 50) // Limit error count
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleTemplate() {
  console.log('Generating template file...')
  
  const templateData = [
    {
      name: 'Sample Product 1',
      sku: 'SP001',
      category_name: 'Electronics',
      price: 99.99,
      min_price: 89.99,
      max_price: 109.99,
      stock: 50,
      threshold: 10,
      description: 'A sample electronic product',
      barcode: '1234567890123',
      supplier: 'Sample Supplier',
      has_serial: 'TRUE',
      serial_numbers: 'SN001,SN002,SN003',
      notes: 'Sample notes'
    },
    {
      name: 'Sample Product 2',
      sku: 'SP002',
      category_name: 'Accessories',
      price: 29.99,
      min_price: 25.99,
      max_price: 34.99,
      stock: 100,
      threshold: 20,
      description: 'A sample accessory',
      barcode: '1234567890124',
      supplier: 'Another Supplier',
      has_serial: 'FALSE',
      serial_numbers: '',
      notes: ''
    }
  ]

  // Create Excel workbook with template
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(templateData)
  
  // Add instructions sheet
  const instructions = [
    { Field: 'name', Required: 'YES', Description: 'Product name' },
    { Field: 'sku', Required: 'YES', Description: 'Unique product SKU/code' },
    { Field: 'category_name', Required: 'YES', Description: 'Category name (must exist)' },
    { Field: 'price', Required: 'YES', Description: 'Product price (number)' },
    { Field: 'min_price', Required: 'NO', Description: 'Minimum price (number)' },
    { Field: 'max_price', Required: 'NO', Description: 'Maximum price (number)' },
    { Field: 'stock', Required: 'YES', Description: 'Current stock quantity (number)' },
    { Field: 'threshold', Required: 'YES', Description: 'Low stock threshold (number)' },
    { Field: 'description', Required: 'NO', Description: 'Product description' },
    { Field: 'barcode', Required: 'NO', Description: 'Product barcode' },
    { Field: 'supplier', Required: 'NO', Description: 'Supplier name' },
    { Field: 'has_serial', Required: 'NO', Description: 'TRUE/FALSE - has serial numbers' },
    { Field: 'serial_numbers', Required: 'NO', Description: 'Comma-separated serial numbers' },
    { Field: 'notes', Required: 'NO', Description: 'Additional notes' }
  ]
  
  const instructionsWs = XLSX.utils.json_to_sheet(instructions)
  
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions')
  
  const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  
  return new Response(excelBuffer, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="product_import_template.xlsx"'
    }
  })
}
