import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Mail, MapPin, Pencil, Building } from "lucide-react";
import type { Household } from "@/types/dashboard";

interface HouseholdDetailsProps {
  household: Household;
  onEdit: () => void;
}

export default function HouseholdDetails({ household, onEdit }: HouseholdDetailsProps) {
  const getHomeTypeIcon = (homeType: string) => {
    switch (homeType?.toLowerCase()) {
      case 'condo':
      case 'apartment':
        return Building;
      default:
        return Home;
    }
  };

  const HomeIcon = getHomeTypeIcon(household.homeType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Household Details</h2>
          <p className="text-muted-foreground">
            View and manage your home information
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={onEdit}
          data-testid="button-edit-household"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-owner-info">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Owner Information</CardTitle>
            <CardDescription>Primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {household.firstName?.[0]}{household.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium" data-testid="text-owner-name">
                  {household.firstName} {household.lastName}
                </p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span data-testid="text-owner-email">{household.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-home-info">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Home Information</CardTitle>
            <CardDescription>Property details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <HomeIcon className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium capitalize" data-testid="text-home-type">
                    {household.homeType}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {household.homeType?.toLowerCase() === 'single family' ? 'Full Maintenance' : 
                     household.homeType?.toLowerCase() === 'condo' || household.homeType?.toLowerCase() === 'apartment' ? 'Interior Only' : 
                     'Standard'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span data-testid="text-location">
                    {household.city}, {household.state} {household.zip}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-subscription-info">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Subscription</CardTitle>
          <CardDescription>Your current plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Badge variant="default">Active</Badge>
              <span className="text-sm text-muted-foreground">
                UpKeep Home Maintenance Plan
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Personalized maintenance reminders and tracking
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
