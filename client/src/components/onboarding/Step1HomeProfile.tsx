import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Building2, Building, Store, Check } from "lucide-react";

interface Step1Data {
  homeType: string;
  squareFootage: string;
}

interface Step1Props {
  data: Step1Data;
  onNext: (data: Step1Data) => void;
}

const HOME_TYPES = [
  {
    value: "Single Family",
    label: "Single Family",
    icon: Home,
    hint: "Includes all maintenance tasks",
    colorClass: "border-blue-500 bg-blue-50 dark:bg-blue-950"
  },
  {
    value: "Condo",
    label: "Condo",
    icon: Building2,
    hint: "HOA-managed tasks excluded",
    colorClass: "border-green-500 bg-green-50 dark:bg-green-950"
  },
  {
    value: "Townhouse",
    label: "Townhouse",
    icon: Building,
    hint: "Mixed interior & exterior",
    colorClass: "border-purple-500 bg-purple-50 dark:bg-purple-950"
  },
  {
    value: "Apartment",
    label: "Apartment",
    icon: Store,
    hint: "Interior tasks only",
    colorClass: "border-orange-500 bg-orange-50 dark:bg-orange-950"
  }
];

export default function Step1HomeProfile({ data, onNext }: Step1Props) {
  const [homeType, setHomeType] = useState(data.homeType || "");
  const [squareFootage, setSquareFootage] = useState(data.squareFootage || "");
  const [dontKnowSquareFootage, setDontKnowSquareFootage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeType) {
      return;
    }
    onNext({
      homeType,
      squareFootage: dontKnowSquareFootage ? "Unknown" : squareFootage
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">What type of home do you have?</CardTitle>
          <CardDescription>
            This determines which maintenance tasks we'll include in your schedule
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HOME_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = homeType === type.value;
              
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setHomeType(type.value)}
                  className={`
                    relative border-2 rounded-lg p-6 text-left transition-all
                    hover:shadow-lg
                    ${isSelected 
                      ? `${type.colorClass} border-2 shadow-md` 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  data-testid={`home-type-${type.value.toLowerCase().replace(' ', '-')}`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <Icon className={`h-12 w-12 mb-3 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                  
                  <div className="font-semibold text-lg mb-1">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.hint}</div>
                </button>
              );
            })}
          </div>

          {homeType && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Great choice!</strong>{" "}
                {homeType === "Condo" || homeType === "Apartment" 
                  ? "We'll skip exterior tasks like gutter cleaning and roof maintenance since your HOA typically handles those."
                  : "You'll get a complete maintenance schedule including exterior tasks like gutter cleaning, roof inspections, and pressure washing."}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="squareFootage">
              Square Footage <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <div className="flex gap-2 flex-wrap">
              <Input
                id="squareFootage"
                type="number"
                placeholder="e.g., 2000"
                value={squareFootage}
                onChange={(e) => {
                  setSquareFootage(e.target.value);
                  setDontKnowSquareFootage(false);
                }}
                disabled={dontKnowSquareFootage}
                className="flex-1 min-w-[150px]"
                data-testid="input-square-footage"
              />
              <Button
                type="button"
                variant={dontKnowSquareFootage ? "default" : "outline"}
                onClick={() => {
                  setDontKnowSquareFootage(!dontKnowSquareFootage);
                  setSquareFootage("");
                }}
                data-testid="button-dont-know-sqft"
              >
                I don't know
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Helps us estimate time for tasks like floor cleaning and HVAC filter sizing
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            size="lg"
            disabled={!homeType}
            data-testid="button-step1-continue"
          >
            Continue to Account Setup
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
