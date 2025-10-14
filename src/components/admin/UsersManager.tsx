import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users, Mail, MapPin, Phone } from 'lucide-react';
import UserForm from './UserForm';

interface UserLocation {
  location_name: string;
  address: string | null;
}

interface User {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  created_at: string;
  locations?: UserLocation[];
}

const UsersManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { language } = useLanguage();
  const { toast } = useToast();

  const translations = {
    fr: {
      title: 'Gestion des Utilisateurs',
      subtitle: 'Gérez les utilisateurs et leurs accès',
      addUser: 'Ajouter un Utilisateur',
      edit: 'Modifier',
      delete: 'Supprimer',
      name: 'Nom',
      email: 'Email',
      role: 'Rôle',
      location: 'Emplacement',
      phone: 'Téléphone',
      admin: 'Administrateur',
      user: 'Utilisateur',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
      userDeleted: 'Utilisateur supprimé avec succès',
      error: 'Erreur',
      noUsers: 'Aucun utilisateur trouvé'
    },
    en: {
      title: 'User Management',
      subtitle: 'Manage users and their access',
      addUser: 'Add User',
      edit: 'Edit',
      delete: 'Delete',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      location: 'Location',
      phone: 'Phone',
      admin: 'Admin',
      user: 'User',
      confirmDelete: 'Are you sure you want to delete this user?',
      userDeleted: 'User deleted successfully',
      error: 'Error',
      noUsers: 'No users found'
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch locations for each user
      const usersWithLocations = await Promise.all(
        (data || []).map(async (user) => {
          const { data: locations } = await supabase
            .from('user_locations')
            .select('location_name, address')
            .eq('user_id', user.user_id);

          return {
            ...user,
            locations: locations || []
          };
        })
      );

      setUsers(usersWithLocations);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: t.error,
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string, userAuthId: string) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      // Delete from auth.users (this will cascade to profiles)
      const { error } = await supabase.auth.admin.deleteUser(userAuthId);

      if (error) throw error;

      setUsers(users.filter(user => user.id !== userId));
      toast({
        title: t.userDeleted,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: t.error,
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.addUser}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t.noUsers}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.name}</TableHead>
                    <TableHead>{t.email}</TableHead>
                    <TableHead>{t.location}</TableHead>
                    <TableHead>{t.phone}</TableHead>
                    <TableHead>{t.role}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.locations && user.locations.length > 0 ? (
                          <div className="space-y-1">
                            {user.locations.map((loc, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <div className="font-medium">{loc.location_name}</div>
                                  {loc.address && (
                                    <div className="text-muted-foreground text-xs">{loc.address}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {user.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {user.phone}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? t.admin : t.user}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            title={t.edit}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user.id, user.user_id)}
                            title={t.delete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <UserForm
          user={editingUser}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default UsersManager;