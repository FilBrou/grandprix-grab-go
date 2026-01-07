import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEvent } from '@/contexts/EventContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Plus, Trash2 } from 'lucide-react';

interface UserLocation {
  location_name: string;
  address: string | null;
}

interface User {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role?: string;
  phone: string | null;
  locations?: UserLocation[];
}

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<Array<{ location_name: string; address: string }>>([
    { location_name: '', address: '' }
  ]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: ''
  });

  const { language } = useLanguage();
  const { currentEvent } = useEvent();
  const { toast } = useToast();

  const translations = {
    fr: {
      title: user ? 'Modifier l\'Utilisateur' : 'Ajouter un Utilisateur',
      formDescription: user ? 'Modifiez les détails de l\'utilisateur' : 'Ajoutez un nouvel utilisateur au système',
      name: 'Nom',
      email: 'Email',
      password: 'Mot de passe',
      passwordHint: 'Laissez vide pour ne pas changer',
      locations: 'Emplacements',
      locationName: 'Nom de l\'emplacement',
      address: 'Adresse',
      addLocation: 'Ajouter un emplacement',
      phone: 'Téléphone',
      role: 'Rôle',
      admin: 'Administrateur',
      user: 'Utilisateur',
      cancel: 'Annuler',
      save: 'Enregistrer',
      update: 'Mettre à jour',
      saving: 'Enregistrement...',
      updating: 'Mise à jour...',
      userSaved: 'Utilisateur créé avec succès',
      userUpdated: 'Utilisateur mis à jour avec succès',
      error: 'Erreur'
    },
    en: {
      title: user ? 'Edit User' : 'Add User',
      formDescription: user ? 'Edit user details' : 'Add a new user to the system',
      name: 'Name',
      email: 'Email',
      password: 'Password',
      passwordHint: 'Leave empty to keep unchanged',
      locations: 'Locations',
      locationName: 'Location Name',
      address: 'Address',
      addLocation: 'Add Location',
      phone: 'Phone',
      role: 'Role',
      admin: 'Admin',
      user: 'User',
      cancel: 'Cancel',
      save: 'Save',
      update: 'Update',
      saving: 'Saving...',
      updating: 'Updating...',
      userSaved: 'User created successfully',
      userUpdated: 'User updated successfully',
      error: 'Error'
    }
  };

  const t = translations[language];

  useEffect(() => {
    const fetchUserLocations = async () => {
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email,
          password: '',
          role: user.role,
          phone: user.phone || ''
        });

        // Fetch user locations
        const { data: userLocations, error } = await supabase
          .from('user_locations')
          .select('location_name, address')
          .eq('user_id', user.user_id);

        if (!error && userLocations && userLocations.length > 0) {
          setLocations(userLocations);
        }
      }
    };

    fetchUserLocations();
  }, [user]);

  const addLocation = () => {
    setLocations([...locations, { location_name: '', address: '' }]);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const updateLocation = (index: number, field: 'location_name' | 'address', value: string) => {
    const newLocations = [...locations];
    newLocations[index][field] = value;
    setLocations(newLocations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (user) {
        // Update existing user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: formData.name || null,
            phone: formData.phone || null
          })
          .eq('user_id', user.user_id);

        if (profileError) throw profileError;

        // Delete existing locations
        await supabase
          .from('user_locations')
          .delete()
          .eq('user_id', user.user_id);

        // Insert new locations
        const validLocations = locations.filter(loc => loc.location_name.trim() !== '');
        if (validLocations.length > 0) {
          const { error: locationsError } = await supabase
            .from('user_locations')
            .insert(
              validLocations.map(loc => ({
                user_id: user.user_id,
                event_id: currentEvent!.id,
                location_name: loc.location_name,
                address: loc.address || null
              }))
            );

          if (locationsError) throw locationsError;
        }

        // Update password and role via Edge Function
        if (formData.password || formData.role !== user.role) {
          const { data, error: updateError } = await supabase.functions.invoke('manage-users', {
            body: {
              action: 'update',
              userData: {
                userId: user.user_id,
                password: formData.password || undefined,
                role: formData.role
              }
            }
          });

          if (updateError) throw updateError;
          if (data?.error) throw new Error(data.error);
        }

        toast({
          title: t.userUpdated,
        });
      } else {
        // Create new user via Edge Function
        const { data, error: createError } = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'create',
            userData: {
              email: formData.email,
              password: formData.password,
              name: formData.name,
              phone: formData.phone,
              role: formData.role
            }
          }
        });

        if (createError) throw createError;
        if (data?.error) throw new Error(data.error);

        const newUserId = data.user.id;

        // Insert locations
        const validLocations = locations.filter(loc => loc.location_name.trim() !== '');
        if (validLocations.length > 0) {
          const { error: locationsError } = await supabase
            .from('user_locations')
            .insert(
              validLocations.map(loc => ({
                user_id: newUserId,
                event_id: currentEvent!.id,
                location_name: loc.location_name,
                address: loc.address || null
              }))
            );

          if (locationsError) throw locationsError;
        }

        toast({
          title: t.userSaved,
        });
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: t.error,
        description: error.message || 'Failed to save user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="fixed inset-0 z-50 m-4 overflow-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.formDescription}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.email} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading || !!user}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {t.password} {user ? '' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!user}
                disabled={isLoading}
                placeholder={user ? t.passwordHint : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t.role} *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t.user}</SelectItem>
                  <SelectItem value="admin">{t.admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t.locations}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLocation}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.addLocation}
              </Button>
            </div>

            {locations.map((location, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor={`location-name-${index}`}>{t.locationName}</Label>
                  <Input
                    id={`location-name-${index}`}
                    value={location.location_name}
                    onChange={(e) => updateLocation(index, 'location_name', e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g., Main Office, Warehouse A"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`address-${index}`}>{t.address}</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`address-${index}`}
                      value={location.address}
                      onChange={(e) => updateLocation(index, 'address', e.target.value)}
                      disabled={isLoading}
                      placeholder="Full address"
                      className="flex-1"
                    />
                    {locations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLocation(index)}
                        disabled={isLoading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t.phone}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user 
                ? (isLoading ? t.updating : t.update) 
                : (isLoading ? t.saving : t.save)
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserForm;