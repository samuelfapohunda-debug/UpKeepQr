import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MessageSquare, User } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors specifically
        if (response.status === 400 && result.errors) {
          const errorMessages = result.errors.map((error: any) => 
            `${error.field}: ${error.message}`
          ).join(", ");
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error(result.message || "Failed to send message");
      }

      toast({
        title: "Message Sent!",
        description: `Thank you for contacting us! We've emailed you a confirmation. Ticket ${result.ticketId}`,
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again or email us directly at Support@UpKeepQr.Com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pt-16">
        {/* Contact Form Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Contact Us</h1>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed">
                  Have questions? We're here to help you get the most out of your home maintenance system.
                </p>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Send us a message
                  </CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll respond to Support@UpKeepQr.Com within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Name *
                        </Label>
                        <Input
                          id="name"
                          {...form.register("name")}
                          placeholder="Your full name"
                          data-testid="input-name"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...form.register("email")}
                          placeholder="your.email@example.com"
                          data-testid="input-email"
                        />
                        {form.formState.errors.email && (
                          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone (Optional)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...form.register("phone")}
                        placeholder="(555) 123-4567"
                        data-testid="input-phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        {...form.register("subject")}
                        placeholder="Brief description of your inquiry"
                        data-testid="input-subject"
                      />
                      {form.formState.errors.subject && (
                        <p className="text-sm text-red-500">{form.formState.errors.subject.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        {...form.register("message")}
                        rows={6}
                        placeholder="Please provide details about your question or issue..."
                        data-testid="textarea-message"
                      />
                      {form.formState.errors.message && (
                        <p className="text-sm text-red-500">{form.formState.errors.message.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                      data-testid="button-submit-contact"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Alternative Contact Info */}
              <div className="mt-8 text-center">
                <p className="text-gray-500 mb-2">Or reach us directly at:</p>
                <a 
                  href="mailto:Support@UpKeepQr.Com"
                  className="text-primary hover:underline font-medium"
                  data-testid="link-email-direct"
                >
                  Support@UpKeepQr.Com
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}