import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Palette, Type, Save, RefreshCw, Trash, Check, Plus } from 'lucide-react';
import { useThemeCustomization, ThemePreset } from '@/contexts/ThemeCustomizationContext';
import { useTheme } from '@/contexts/useTheme';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  colorPreview?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, colorPreview = true }) => {
  // Handle HSL value for color preview
  const getHexFromHsl = (hslValue: string) => {
    try {
      return `hsl(${hslValue})`;
    } catch (e) {
      return '#cccccc';
    }
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <Label htmlFor={label} className="text-sm font-medium">
          {label}
        </Label>
        {colorPreview && (
          <div 
            className="w-5 h-5 rounded-full border border-border" 
            style={{ backgroundColor: getHexFromHsl(value) }}
          />
        )}
      </div>
      <Input 
        id={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
};

export const ThemeCustomizationPanel: React.FC = () => {
  const { 
    currentTheme, 
    presets, 
    addPreset, 
    updatePreset, 
    deletePreset, 
    applyPreset,
    updateCurrentTheme,
    resetToDefault 
  } = useThemeCustomization();
  const { theme } = useTheme();
  
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [activeTab, setActiveTab] = useState('colors');
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);

  // Handle saving the current theme as a new preset
  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: Omit<ThemePreset, 'id'> = {
      name: newPresetName,
      description: newPresetDescription,
      colors: { ...currentTheme.colors },
      options: { ...currentTheme.options },
      chartColors: { ...currentTheme.chartColors }
    };
    
    addPreset(newPreset);
    setNewPresetName('');
    setNewPresetDescription('');
    setIsCreatingPreset(false);
  };

  // Handle updating a color value
  const handleColorChange = (key: string, value: string) => {
    // Create a copy of the current colors and update the specific key
    const updatedColors = { ...currentTheme.colors };
    updatedColors[key as keyof typeof updatedColors] = value;
    
    // Update the theme with the modified colors
    updateCurrentTheme({
      colors: updatedColors
    });
  };

  // Handle updating a chart color value
  const handleChartColorChange = (key: string, value: string) => {
    // Create a copy of the current chart colors and update the specific key
    const updatedChartColors = { ...currentTheme.chartColors };
    updatedChartColors[key as keyof typeof updatedChartColors] = value;
    
    // Update the theme with the modified chart colors
    updateCurrentTheme({
      chartColors: updatedChartColors
    });
  };

  // Handle updating options
  const handleOptionChange = (key: string, value: string) => {
    // Create a copy of the current options and update the specific key
    const updatedOptions = { ...currentTheme.options };
    updatedOptions[key as keyof typeof updatedOptions] = value;
    
    // Update the theme with the modified options
    updateCurrentTheme({
      options: updatedOptions
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Customize Theme</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Theme Customization
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="colors" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="colors" className="flex gap-1 items-center">
              <Palette className="h-4 w-4" />
              <span>Colors</span>
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex gap-1 items-center">
              <Type className="h-4 w-4" />
              <span>Typography & UI</span>
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex gap-1 items-center">
              <Save className="h-4 w-4" />
              <span>Presets</span>
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Base Colors</h3>
                <div>
                  <ColorPicker 
                    label="Background" 
                    value={currentTheme.colors.background} 
                    onChange={(v) => handleColorChange('background', v)} 
                  />
                  <ColorPicker 
                    label="Foreground" 
                    value={currentTheme.colors.foreground} 
                    onChange={(v) => handleColorChange('foreground', v)} 
                  />
                  <ColorPicker 
                    label="Primary" 
                    value={currentTheme.colors.primary} 
                    onChange={(v) => handleColorChange('primary', v)} 
                  />
                  <ColorPicker 
                    label="Primary Foreground" 
                    value={currentTheme.colors.primaryForeground} 
                    onChange={(v) => handleColorChange('primaryForeground', v)} 
                  />
                  <ColorPicker 
                    label="Secondary" 
                    value={currentTheme.colors.secondary} 
                    onChange={(v) => handleColorChange('secondary', v)} 
                  />
                  <ColorPicker 
                    label="Secondary Foreground" 
                    value={currentTheme.colors.secondaryForeground} 
                    onChange={(v) => handleColorChange('secondaryForeground', v)} 
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">UI Element Colors</h3>
                <div>
                  <ColorPicker 
                    label="Card" 
                    value={currentTheme.colors.card} 
                    onChange={(v) => handleColorChange('card', v)} 
                  />
                  <ColorPicker 
                    label="Card Foreground" 
                    value={currentTheme.colors.cardForeground} 
                    onChange={(v) => handleColorChange('cardForeground', v)} 
                  />
                  <ColorPicker 
                    label="Accent" 
                    value={currentTheme.colors.accent} 
                    onChange={(v) => handleColorChange('accent', v)} 
                  />
                  <ColorPicker 
                    label="Accent Foreground" 
                    value={currentTheme.colors.accentForeground} 
                    onChange={(v) => handleColorChange('accentForeground', v)} 
                  />
                  <ColorPicker 
                    label="Muted" 
                    value={currentTheme.colors.muted} 
                    onChange={(v) => handleColorChange('muted', v)} 
                  />
                  <ColorPicker 
                    label="Muted Foreground" 
                    value={currentTheme.colors.mutedForeground} 
                    onChange={(v) => handleColorChange('mutedForeground', v)} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Status Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ColorPicker 
                    label="Success" 
                    value={currentTheme.colors.success} 
                    onChange={(v) => handleColorChange('success', v)} 
                  />
                  <ColorPicker 
                    label="Success Foreground" 
                    value={currentTheme.colors.successForeground} 
                    onChange={(v) => handleColorChange('successForeground', v)} 
                  />
                  <ColorPicker 
                    label="Warning" 
                    value={currentTheme.colors.warning} 
                    onChange={(v) => handleColorChange('warning', v)} 
                  />
                  <ColorPicker 
                    label="Warning Foreground" 
                    value={currentTheme.colors.warningForeground} 
                    onChange={(v) => handleColorChange('warningForeground', v)} 
                  />
                </div>
                <div>
                  <ColorPicker 
                    label="Error" 
                    value={currentTheme.colors.error} 
                    onChange={(v) => handleColorChange('error', v)} 
                  />
                  <ColorPicker 
                    label="Error Foreground" 
                    value={currentTheme.colors.errorForeground} 
                    onChange={(v) => handleColorChange('errorForeground', v)} 
                  />
                  <ColorPicker 
                    label="Info" 
                    value={currentTheme.colors.info} 
                    onChange={(v) => handleColorChange('info', v)} 
                  />
                  <ColorPicker 
                    label="Info Foreground" 
                    value={currentTheme.colors.infoForeground} 
                    onChange={(v) => handleColorChange('infoForeground', v)} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Border & Input Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker 
                  label="Border" 
                  value={currentTheme.colors.border} 
                  onChange={(v) => handleColorChange('border', v)} 
                />
                <ColorPicker 
                  label="Input" 
                  value={currentTheme.colors.input} 
                  onChange={(v) => handleColorChange('input', v)} 
                />
                <ColorPicker 
                  label="Ring" 
                  value={currentTheme.colors.ring} 
                  onChange={(v) => handleColorChange('ring', v)} 
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefault}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset to Default
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('presets')}
                className="flex items-center gap-1"
              >
                <Save className="h-3.5 w-3.5" />
                Save as Preset
              </Button>
            </div>
          </TabsContent>

          {/* Typography & UI Tab */}
          <TabsContent value="typography" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Typography Settings</h3>
                <ColorPicker 
                  label="Font Family" 
                  value={currentTheme.options.fontFamily} 
                  onChange={(v) => handleOptionChange('fontFamily', v)} 
                  colorPreview={false}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">UI Settings</h3>
                <ColorPicker 
                  label="Border Radius" 
                  value={currentTheme.options.borderRadius} 
                  onChange={(v) => handleOptionChange('borderRadius', v)} 
                  colorPreview={false}
                />
                <ColorPicker 
                  label="Shadow" 
                  value={currentTheme.options.shadow} 
                  onChange={(v) => handleOptionChange('shadow', v)} 
                  colorPreview={false}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Chart Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker 
                    label="Chart 1" 
                    value={currentTheme.chartColors.chart1} 
                    onChange={(v) => handleChartColorChange('chart1', v)} 
                  />
                  <ColorPicker 
                    label="Chart 2" 
                    value={currentTheme.chartColors.chart2} 
                    onChange={(v) => handleChartColorChange('chart2', v)} 
                  />
                  <ColorPicker 
                    label="Chart 3" 
                    value={currentTheme.chartColors.chart3} 
                    onChange={(v) => handleChartColorChange('chart3', v)} 
                  />
                  <ColorPicker 
                    label="Chart 4" 
                    value={currentTheme.chartColors.chart4} 
                    onChange={(v) => handleChartColorChange('chart4', v)} 
                  />
                  <ColorPicker 
                    label="Chart 5" 
                    value={currentTheme.chartColors.chart5} 
                    onChange={(v) => handleChartColorChange('chart5', v)} 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefault}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset to Default
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('presets')}
                className="flex items-center gap-1"
              >
                <Save className="h-3.5 w-3.5" />
                Save as Preset
              </Button>
            </div>
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-4">
            {isCreatingPreset ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Create New Preset</CardTitle>
                  <CardDescription>Save your current theme settings as a preset</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="preset-name">Preset Name</Label>
                      <Input 
                        id="preset-name" 
                        value={newPresetName} 
                        onChange={(e) => setNewPresetName(e.target.value)} 
                        placeholder="My Custom Theme"
                      />
                    </div>
                    <div>
                      <Label htmlFor="preset-description">Description (Optional)</Label>
                      <Input 
                        id="preset-description" 
                        value={newPresetDescription} 
                        onChange={(e) => setNewPresetDescription(e.target.value)} 
                        placeholder="A brief description of your theme"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatingPreset(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSavePreset}
                    disabled={!newPresetName.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Preset
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Button
                onClick={() => setIsCreatingPreset(true)}
                className="w-full flex items-center justify-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Create New Preset
              </Button>
            )}

            <h3 className="text-sm font-medium mt-4 mb-2">Available Presets</h3>
            <div className="grid grid-cols-1 gap-3">
              {presets.map((preset) => (
                <Card key={preset.id} className={currentTheme.id === preset.id ? 'border-primary' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{preset.name}</CardTitle>
                        {preset.description && (
                          <CardDescription className="text-xs">{preset.description}</CardDescription>
                        )}
                      </div>
                      {(preset.id === 'default-light' && theme === 'light') || 
                       (preset.id === 'default-dark' && theme === 'dark') ? (
                        <Badge variant="outline">Default</Badge>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-1 flex justify-between">
                    {currentTheme.id === preset.id ? (
                      <Badge variant="outline" className="flex gap-1 items-center">
                        <Check className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyPreset(preset.id)}
                      >
                        Apply
                      </Button>
                    )}
                    {preset.id !== 'default-light' && preset.id !== 'default-dark' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deletePreset(preset.id)}
                      >
                        <Trash className="h-3.5 w-3.5 text-error" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 