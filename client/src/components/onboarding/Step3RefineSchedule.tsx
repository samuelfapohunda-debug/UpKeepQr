import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";

interface Step3Data {
  hvacType: string;
  waterHeaterType: string;
  yearBuilt: string;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ hvacType, waterHeaterType, yearBuilt });
  };

  const currentYear = new Date().getFullYear();
  const decades = ["2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "1960s", "Before 1960"];

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
          <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-purple-800 dark:text-purple-200">
              These details help us customize maintenance intervals and remind you about
              model-specific tasks. You can always add or change this later.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hvacType">HVAC System Type</Label>
            <Select value={hvacType} onValueChange={setHvacType}>
              <SelectTrigger data-testid="select-hvac-type">
                <SelectValue placeholder="Select your HVAC type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Central AC">Central AC</SelectItem>
                <SelectItem value="Heat Pump">Heat Pump</SelectItem>
                <SelectItem value="Furnace">Furnace</SelectItem>
                <SelectItem value="Window Units">Window Units</SelectItem>
                <SelectItem value="Mini Split">Mini Split</SelectItem>
                <SelectItem value="Radiant Heat">Radiant Heat</SelectItem>
                <SelectItem value="None">None / Don't Know</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Affects filter replacement and seasonal maintenance schedules
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waterHeaterType">Water Heater Type</Label>
            <Select value={waterHeaterType} onValueChange={setWaterHeaterType}>
              <SelectTrigger data-testid="select-water-heater">
                <SelectValue placeholder="Select your water heater type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tank (Gas)">Tank (Gas)</SelectItem>
                <SelectItem value="Tank (Electric)">Tank (Electric)</SelectItem>
                <SelectItem value="Tankless">Tankless</SelectItem>
                <SelectItem value="Heat Pump">Heat Pump Water Heater</SelectItem>
                <SelectItem value="Solar">Solar</SelectItem>
                <SelectItem value="None">None / Don't Know</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Determines flushing schedules and anode rod inspections
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearBuilt">When Was Your Home Built?</Label>
            <Select value={yearBuilt} onValueChange={setYearBuilt}>
              <SelectTrigger data-testid="select-year-built">
                <SelectValue placeholder="Select decade" />
              </SelectTrigger>
              <SelectContent>
                {decades.map((decade) => (
                  <SelectItem key={decade} value={decade}>{decade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Helps prioritize tasks for older home systems
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
              type="submit" 
              className="flex-1"
              size="lg"
              data-testid="button-step3-continue"
            >
              Continue to Notifications
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="w-full"
            data-testid="button-step3-skip"
          >
            Skip - I'll add these later
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
