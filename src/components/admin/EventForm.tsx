import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';

interface Event {
  id?: string;
  name: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  logo_url: string;
  hero_image_url: string;
  theme_color: string;
  location: string;
  settings: {
    allow_orders: boolean;
    require_collection_point: boolean;
    enable_notifications: boolean;
    currency: string;
    timezone: string;
  };
}

interface EventFormProps {
  event?: Event | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({ event, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Event>({
    name: '',
    slug: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    logo_url: '',
    hero_image_url: '',
    theme_color: '#FF0000',
    location: '',
    settings: {
      allow_orders: true,
      require_collection_point: true,
      enable_notifications: true,
      currency: 'CAD',
      timezone: 'America/Montreal',
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (event) {
      setFormData(event);
    }
  }, [event]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: event?.id ? formData.slug : generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (event?.id) {
        const { error } = await supabase
          .from('events')
          .update(formData)
          .eq('id', event.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Event updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('events')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Event created successfully',
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{event?.id ? 'Edit Event' : 'Create New Event'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="theme_color">Theme Color</Label>
              <Input
                id="theme_color"
                type="color"
                value={formData.theme_color}
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="hero_image_url">Hero Image URL</Label>
            <Input
              id="hero_image_url"
              value={formData.hero_image_url}
              onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Settings</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="allow_orders">Allow Orders</Label>
              <Switch
                id="allow_orders"
                checked={formData.settings.allow_orders}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, allow_orders: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="require_collection_point">Require Collection Point</Label>
              <Switch
                id="require_collection_point"
                checked={formData.settings.require_collection_point}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, require_collection_point: checked },
                  })
                }
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : event?.id ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
