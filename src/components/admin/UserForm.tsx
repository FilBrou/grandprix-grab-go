import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X } from 'lucide-react';

interface User {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: string;
  location: string | null;
  phone: string | null;
}

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    location: '',
    phone: ''
  });

  const { language } = useLanguage();
  const { toast } = useToast();

  const translations = {
    fr: {
      title: user ? 'Modifier l\'Utilisateur' : 'Ajouter un Utilisateur',
      formDescription: user ? 'Modifiez les détails de l\'utilisateur' : 'Ajoutez un nouvel utilisateur au système',
      name: 'Nom',
      email: 'Email',
      password: 'Mot de passe',
      passwordHint: 'Laissez vide pour ne pas changer',
      location: 'Emplacement',
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
      location: 'Location',
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
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email,
        password: '',
        role: user.role,
        location: user.location || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (user) {
        // Update existing user
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: formData.name || null,
            role: formData.role,
            location: formData.location || null,
            phone: formData.phone || null
          })
          .eq('user_id', user.user_id);

        if (profileError) throw profileError;

        // Update password if provided
        if (formData.password) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            user.user_id,
            { password: formData.password }
          );
          if (passwordError) throw passwordError;
        }

        toast({
          title: t.userUpdated,
        });
      } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            name: formData.name
          }
        });

        if (authError) throw authError;

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            user_id: authData.user.id,
            email: formData.email,
            name: formData.name || null,
            role: formData.role,
            location: formData.location || null,
            phone: formData.phone || null
          }]);

        if (profileError) throw profileError;

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

            <div className="space-y-2">
              <Label htmlFor="location">{t.location}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={isLoading}
              />
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