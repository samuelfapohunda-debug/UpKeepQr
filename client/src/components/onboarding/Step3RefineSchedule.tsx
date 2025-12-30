import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, Home } from "lucide-react";

interface Step3Data {
  hvacType: string;
  waterHeaterType: string;
  yearBuilt: string;
  squareFootage: string;
  homeType: string;
}

interface Step3Props {
  data: Step3Data;
  onNext: (data: Step3Data) => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function Step3RefineSchedule({ data, onNext, onBack, onSkip }: Step3Props) {
  const [hvacType, setHvacType] = useState(data.hvacType || "");
  const [waterHeaterType, setWaterHeaterType] = useState(data.waterHeaterType || "");
  const [yearBuilt, setYearBuilt] = useState(data.yearBuilt || "");
  const [squareFootage, setSquareFootage] = useState(
    data.squareFootage === "Unknown" ? "" : (data.squareFootage || "")
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ 
      hvacType, 
      waterHeaterType, 
      yearBuilt, 
      squareFootage: squareFootage || data.squareFootage,
      homeType: data.homeType
    });
  };

  const currentYear = new Date().getFullYear();
  const showSquareFootageUpdate = data.squareFootage === "Unknown" || !data.squareFootage;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Refine Your Schedule</CardTitle>
          <CardDescription>
            Optional - Adding these details improves task timing and reminders
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-purple-800 dark:text-purple-200">
                These details help us customize maintenance intervals and remind you about
                system-specific tasks like filter changes and annual inspections.
              </p>
            </div>
          </div>

          {data.homeType && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <Home className="h-5 w-5 text-primary" />
              <span className="text-sm">
                <strong>Home Type:</strong> {data.homeType}
                {data.squareFootage && data.squareFootage !== "Unknown" && (
                  <span className="text-muted-foreground"> ({data.squareFootage} sq ft)</span>
                )}
              </span>
            </div>
          )}

          {showSquareFootageUpdate && (
            <div className="space-y-2">
              <Label htmlFor="squareFootage">
                Square Footage <span className="text-muted-foreground">(if you know it now)</span>
              </Label>
              <Input
                id="squareFootage"
                type="number"
                placeholder="e.g., 2000"
                value={squareFootage}
                onChange={(e) => setSquareFootage(e.target.value)}
                data-testid="input-square-footage-step3"
              />
              <p className="text-xs text-muted-foreground">
                Helps us estimate time for tasks like floor cleaning and HVAC filter sizing
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="hvacType">
              Primary Heating & Cooling System
            </Label>
            <Select value={hvacType} onValueChange={setHvacType}>
              <SelectTrigger id="hvacType" data-testid="select-hvac-type">
                <SelectValue placeholder="Select your system..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Central AC">Central AC (Forced Air)</SelectItem>
                <SelectItem value="Heat Pump">Heat Pump</SelectItem>
                <SelectItem value="Mini Split">Ductless Mini-Split</SelectItem>
                <SelectItem value="Window Units">Window AC Units</SelectItem>
                <SelectItem value="Radiator">Radiator / Baseboard</SelectItem>
                <SelectItem value="None">No HVAC System</SelectItem>
                <SelectItem value="Unknown">I'm not sure</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Determines filter change reminders and seasonal tune-up schedules
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waterHeaterType">
              Water Heater Type
            </Label>
            <Select value={waterHeaterType} onValueChange={setWaterHeaterType}>
              <SelectTrigger id="waterHeaterType" data-testid="select-water-heater">
                <SelectValue placeholder="Select your water heater..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tank">Traditional Tank (Gas or Electric)</SelectItem>
                <SelectItem value="Tankless">Tankless / On-Demand</SelectItem>
                <SelectItem value="Heat Pump">Heat Pump Water Heater</SelectItem>
                <SelectItem value="Solar">Solar Water Heater</SelectItem>
                <SelectItem value="Unknown">I'm not sure</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Affects flushing schedules and anode rod replacement reminders
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearBuilt">
              Year Home Was Built
            </Label>
            <Input
              id="yearBuilt"
              type="number"
              placeholder={`e.g., ${currentYear - 20}`}
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value)}
              min={1800}
              max={currentYear}
              data-testid="input-year-built"
            />
            <p className="text-xs text-muted-foreground">
              Helps prioritize inspections for older systems and materials
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              className="flex-1"
              data-testid="button-step3-back"
            >
              Back
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onSkip}
              className="flex-1"
              data-testid="button-step3-skip"
            >
              Skip This Step
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              size="lg"
              data-testid="button-step3-continue"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
