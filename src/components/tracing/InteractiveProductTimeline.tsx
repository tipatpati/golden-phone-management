import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronLeft,
  ChevronRight,
  Package, 
  Edit, 
  ShoppingCart,
  Clock,
  MapPin,
  User,
  Euro,
  Activity,
  TrendingUp,
  Info
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProductTraceResult } from '@/services/tracing/types';
import { ProductStateReconstructor, TimelinePoint } from '@/services/tracing/ProductStateReconstructor';

interface InteractiveProductTimelineProps {
  traceResult: ProductTraceResult;
  className?: string;
}

export function InteractiveProductTimeline({ traceResult, className }: InteractiveProductTimelineProps) {
  const timeline = useMemo(
    () => ProductStateReconstructor.reconstructTimeline(traceResult),
    [traceResult]
  );

  const [currentIndex, setCurrentIndex] = useState(timeline.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);

  const currentPoint = timeline[currentIndex];
  const previousPoint = currentIndex > 0 ? timeline[currentIndex - 1] : null;

  // Auto-play functionality
  React.useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= timeline.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, timeline.length]);

  const handleSliderChange = (value: number[]) => {
    setCurrentIndex(value[0]);
    setIsPlaying(false);
  };

  const goToNext = () => {
    if (currentIndex < timeline.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(false);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(false);
    }
  };

  const togglePlayback = () => {
    if (currentIndex >= timeline.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const rewind = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'acquisition': return Package;
      case 'modification': return Edit;
      case 'sale': return ShoppingCart;
      default: return Activity;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'acquisition': return 'bg-blue-500';
      case 'modification': return 'bg-yellow-500';
      case 'sale': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'supplier': return TrendingUp;
      case 'inventory': return Package;
      case 'customer': return ShoppingCart;
      default: return MapPin;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), 'MMM dd, yyyy HH:mm');
    } catch {
      return new Date(timestamp).toLocaleString();
    }
  };

  if (timeline.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No timeline data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Product Lifecycle Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline Controls */}
        <div className="space-y-4">
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={rewind}
              disabled={currentIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={togglePlayback}
              className="h-12 w-12"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex === timeline.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentIndex(timeline.length - 1)}
              disabled={currentIndex === timeline.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Timeline Slider */}
          <div className="space-y-2">
            <Slider
              value={[currentIndex]}
              max={timeline.length - 1}
              step={1}
              onValueChange={handleSliderChange}
              className="w-full"
            />
            
            {/* Timeline Markers */}
            <div className="flex justify-between px-2">
              {timeline.map((point, index) => {
                const Icon = getEventIcon(point.eventType);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsPlaying(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all",
                      index === currentIndex && "scale-125"
                    )}
                  >
                    <div className={cn(
                      "h-3 w-3 rounded-full transition-all",
                      getEventColor(point.eventType),
                      index === currentIndex && "ring-2 ring-primary ring-offset-2"
                    )} />
                  </button>
                );
              })}
            </div>

            {/* Progress Info */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Event {currentIndex + 1} of {timeline.length}</span>
              <span>{formatTimestamp(currentPoint.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Current State Display */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Event Info */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {React.createElement(getEventIcon(currentPoint.eventType), {
                  className: "h-5 w-5"
                })}
                <CardTitle className="text-base">Current Event</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Badge className={cn("mb-2", getEventColor(currentPoint.eventType), "text-white")}>
                  {currentPoint.eventType.toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {formatTimestamp(currentPoint.timestamp)}
                </p>
              </div>

              {currentPoint.changes && Object.keys(currentPoint.changes).length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Changes:</p>
                  {Object.entries(currentPoint.changes).map(([key, change]) => (
                    <div key={key} className="text-xs bg-background rounded p-2">
                      <span className="font-medium">{key}:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted-foreground line-through">
                          {String(change.from || 'N/A')}
                        </span>
                        <span>→</span>
                        <span className="text-primary font-medium">
                          {String(change.to || 'N/A')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product State */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Product State
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="outline">{currentPoint.state.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Condition</p>
                  <Badge variant="outline">{currentPoint.state.condition}</Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <div className="flex items-center gap-2">
                  {React.createElement(getLocationIcon(currentPoint.state.location), {
                    className: "h-4 w-4"
                  })}
                  <span className="font-medium capitalize">{currentPoint.state.location}</span>
                </div>
              </div>

              {currentPoint.state.owner && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Owner</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{currentPoint.state.owner}</span>
                  </div>
                </div>
              )}

              {currentPoint.state.price && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Price</p>
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    <span className="font-medium">€{Number(currentPoint.state.price).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Specifications */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Specifications</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {currentPoint.state.specs.color && (
                    <div className="bg-background rounded p-2">
                      <span className="text-muted-foreground">Color:</span>
                      <span className="ml-1 font-medium">{currentPoint.state.specs.color}</span>
                    </div>
                  )}
                  {currentPoint.state.specs.storage && (
                    <div className="bg-background rounded p-2">
                      <span className="text-muted-foreground">Storage:</span>
                      <span className="ml-1 font-medium">{currentPoint.state.specs.storage}GB</span>
                    </div>
                  )}
                  {currentPoint.state.specs.ram && (
                    <div className="bg-background rounded p-2">
                      <span className="text-muted-foreground">RAM:</span>
                      <span className="ml-1 font-medium">{currentPoint.state.specs.ram}GB</span>
                    </div>
                  )}
                  {currentPoint.state.specs.battery_level !== undefined && (
                    <div className="bg-background rounded p-2">
                      <span className="text-muted-foreground">Battery:</span>
                      <span className="ml-1 font-medium">{currentPoint.state.specs.battery_level}%</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Events List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Complete Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {timeline.map((point, index) => {
                  const Icon = getEventIcon(point.eventType);
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index);
                        setIsPlaying(false);
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all",
                        index === currentIndex 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                          getEventColor(point.eventType)
                        )}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {point.eventType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(point.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm font-medium truncate">
                            {point.state.owner || point.eventType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {point.state.location} • {point.state.status}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
