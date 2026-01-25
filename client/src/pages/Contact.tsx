import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api-config";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  helpType: z.string().min(1, "Please select how we can help"),
  message: z.string().min(10, "Comment is required (minimum 10 characters)"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const searchString = useSearch();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      helpType: "",
      message: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const type = params.get('type');
    if (type === 'demo') {
      form.setValue('helpType', 'demo', { shouldValidate: false });
    }
  }, [searchString, form]);

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          subject: data.helpType,
          message: data.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400 && result.errors) {
          const errorMessages = result.errors.map((error: { field: string; message: string }) => 
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
        description: error instanceof Error ? error.message : "Failed to send message. Please try again or email us directly at Support@UpKeepQr.Com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 md:py-20">
      <div className="container px-4 md:px-6 mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* LEFT COLUMN - CONTACT FORM */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-contact-title">
              Let's Chat
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              An UpKeepQR expert will reach out to discuss your needs.
            </p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    placeholder="First Name"
                    className="h-12"
                    data-testid="input-first-name"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    placeholder="Last Name"
                    className="h-12"
                    data-testid="input-last-name"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Work Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="your.email@company.com"
                  className="h-12"
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="helpType" className="text-gray-700 dark:text-gray-300">
                  How can we help? *
                </Label>
                <Select
                  value={form.watch("helpType")}
                  onValueChange={(value) => form.setValue("helpType", value, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-12" data-testid="select-help-type">
                    <SelectValue placeholder="How can we help?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General question</SelectItem>
                    <SelectItem value="demo">Request a demo</SelectItem>
                    <SelectItem value="partner">Partner Opportunity</SelectItem>
                    <SelectItem value="career">Career Opportunity</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.helpType && (
                  <p className="text-sm text-red-500">{form.formState.errors.helpType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-700 dark:text-gray-300">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  {...form.register("message")}
                  rows={5}
                  placeholder="Comment is required"
                  className="resize-y min-h-[120px]"
                  data-testid="textarea-message"
                />
                {form.formState.errors.message && (
                  <p className="text-sm text-red-500">{form.formState.errors.message.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isSubmitting}
                data-testid="button-submit-contact"
              >
                {isSubmitting ? "Sending..." : "Submit"}
              </Button>

              {/* Consent Footer */}
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-5">
                By clicking submit you consent to receive email communications about UpKeepQR 
                products and services and agree to our{" "}
                <Link href="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </Link>. 
                Your data will be processed in accordance with our{" "}
                <Link href="/terms-of-service" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Terms of Service
                </Link>. 
                You may opt out at any time.
              </p>
            </form>
          </div>

          {/* RIGHT COLUMN - STATISTICS */}
          <div className="flex flex-col justify-center p-8 md:p-10 lg:pt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              Built for Homeowners — Powerful Enough for Professionals
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 leading-relaxed">
              Whether you're protecting your own home or managing properties for clients, 
              UpKeepQR scales with your needs.
            </p>

            <div className="space-y-10">
              <div data-testid="stat-homeowners">
                <div className="text-5xl md:text-6xl font-bold text-blue-600 dark:text-blue-400 leading-none mb-2">
                  5000+
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                  Homeowner subscriptions in North America
                </div>
              </div>

              <div data-testid="stat-realtors">
                <div className="text-5xl md:text-6xl font-bold text-blue-600 dark:text-blue-400 leading-none mb-2">
                  100+
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                  Realtor subscriptions in North America
                </div>
              </div>

              <div data-testid="stat-apartments">
                <div className="text-5xl md:text-6xl font-bold text-blue-600 dark:text-blue-400 leading-none mb-2">
                  20+
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                  Apartment Complex subscriptions in North America
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
