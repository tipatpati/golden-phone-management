import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Loader2 } from "lucide-react";

interface ContactSupplierDialogProps {
  supplier: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactSupplierDialog({
  supplier,
  open,
  onOpenChange,
}: ContactSupplierDialogProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (supplier) {
      setSubject(`Inquiry regarding supply partnership - ${supplier.name}`);
      setMessage(`Dear ${supplier.contact_person || supplier.name},

I hope this message finds you well. We would like to discuss our current inventory needs and explore potential supply opportunities.

Please let us know a convenient time to discuss our requirements in detail.

Best regards,
[Your Company Name]`);
    }
  }, [supplier]);

  const handleSendMessage = async () => {
    if (!supplier?.email) {
      toast.error("Supplier email not available");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('contact-suppliers', {
        body: {
          type: 'individual',
          supplierId: supplier.id,
          supplierEmail: supplier.email,
          supplierName: supplier.name,
          subject: subject.trim(),
          message: message.trim(),
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Message sent successfully!");
      onOpenChange(false);
      setSubject("");
      setMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact {supplier?.name}
          </DialogTitle>
          <DialogDescription>
            Send a message to {supplier?.contact_person || supplier?.name} at {supplier?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="subject" className="text-base font-medium">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="message" className="text-base font-medium">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              rows={6}
              className="resize-none text-base"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !subject.trim() || !message.trim()}
            className="w-full min-h-[44px] text-base flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isLoading ? "Sending..." : "Send Message"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full min-h-[44px] text-base"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}