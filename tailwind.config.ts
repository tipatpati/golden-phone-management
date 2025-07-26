import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Poppins', 'ui-sans-serif', 'system-ui'],
				title: ['Sora', 'ui-sans-serif', 'system-ui'],
			},
			spacing: {
				'1': 'var(--spacing-1)',    /* 4dp */
				'2': 'var(--spacing-2)',    /* 8dp */
				'3': 'var(--spacing-3)',    /* 12dp */
				'4': 'var(--spacing-4)',    /* 16dp */
				'5': 'var(--spacing-5)',    /* 20dp */
				'6': 'var(--spacing-6)',    /* 24dp */
				'8': 'var(--spacing-8)',    /* 32dp */
				'10': 'var(--spacing-10)',  /* 40dp */
				'12': 'var(--spacing-12)',  /* 48dp */
				'14': 'var(--spacing-14)',  /* 56dp */
				'16': 'var(--spacing-16)',  /* 64dp */
				'20': 'var(--spacing-20)',  /* 80dp */
				'24': 'var(--spacing-24)',  /* 96dp */
				// Legacy compatibility
				'xs': 'var(--spacing-xs)',
				'sm': 'var(--spacing-sm)', 
				'md': 'var(--spacing-md)',
				'lg': 'var(--spacing-lg)',
				'xl': 'var(--spacing-xl)',
				'2xl': 'var(--spacing-2xl)',
				'3xl': 'var(--spacing-3xl)',
			},
			fontSize: {
				'xs': 'var(--font-size-xs)',
				'sm': 'var(--font-size-sm)',
				'base': 'var(--font-size-base)',
				'lg': 'var(--font-size-lg)',
				'xl': 'var(--font-size-xl)',
				'2xl': 'var(--font-size-2xl)',
				'3xl': 'var(--font-size-3xl)',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					container: 'hsl(var(--primary-container))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					container: 'hsl(var(--secondary-container))'
				},
				tertiary: {
					DEFAULT: 'hsl(var(--tertiary))',
					foreground: 'hsl(var(--tertiary-foreground))',
					container: 'hsl(var(--tertiary-container))'
				},
				surface: {
					DEFAULT: 'hsl(var(--surface))',
					dim: 'hsl(var(--surface-dim))',
					bright: 'hsl(var(--surface-bright))',
					'container-lowest': 'hsl(var(--surface-container-lowest))',
					'container-low': 'hsl(var(--surface-container-low))',
					container: 'hsl(var(--surface-container))',
					'container-high': 'hsl(var(--surface-container-high))',
					'container-highest': 'hsl(var(--surface-container-highest))'
				},
				'on-surface': 'hsl(var(--on-surface))',
				'on-surface-variant': 'hsl(var(--on-surface-variant))',
				'on-primary-container': 'hsl(var(--on-primary-container))',
				'on-secondary-container': 'hsl(var(--on-secondary-container))',
				'on-tertiary-container': 'hsl(var(--on-tertiary-container))',
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0', opacity: '0' },
					to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},
				// Material Design animations
				'md-fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'md-fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' }
				},
				'md-scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.8)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'md-scale-out': {
					'0%': { opacity: '1', transform: 'scale(1)' },
					'100%': { opacity: '0', transform: 'scale(0.8)' }
				},
				'md-slide-up': {
					'0%': { opacity: '0', transform: 'translateY(40px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'md-slide-down': {
					'0%': { opacity: '0', transform: 'translateY(-40px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				// Legacy animations
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(10px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down var(--motion-duration-medium-2) var(--motion-emphasized-decelerate)',
				'accordion-up': 'accordion-up var(--motion-duration-short-4) var(--motion-emphasized-accelerate)',
				// Material Design animations
				'md-fade-in': 'md-fade-in var(--motion-duration-medium-2) var(--motion-emphasized-decelerate)',
				'md-fade-out': 'md-fade-out var(--motion-duration-short-4) var(--motion-emphasized-accelerate)',
				'md-scale-in': 'md-scale-in var(--motion-duration-medium-1) var(--motion-emphasized-decelerate)',
				'md-scale-out': 'md-scale-out var(--motion-duration-short-4) var(--motion-emphasized-accelerate)',
				'md-slide-up': 'md-slide-up var(--motion-duration-medium-3) var(--motion-emphasized-decelerate)',
				'md-slide-down': 'md-slide-down var(--motion-duration-medium-3) var(--motion-emphasized-decelerate)',
				// Legacy animations
				'fade-in': 'fade-in var(--motion-duration-medium-2) var(--motion-standard)',
				'fade-out': 'fade-out var(--motion-duration-medium-2) var(--motion-standard)'
			},
			letterSpacing: {
				wider: '0.1em',
				widest: '0.25em'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
