import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Upload } from 'lucide-react';
import Header from './Header';

interface Candidate {
  id: string;
  name: string;
  imageUrl: string;
  logoUrl: string;
}

interface Role {
  id: string;
  name: string;
  candidates: Candidate[];
}

interface CreatePollProps {
  onBack: () => void;
}

export default function CreatePoll({ onBack }: CreatePollProps) {
  const { teacherId } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: '', candidates: [] },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addRole = () => {
    setRoles([
      ...roles,
      { id: Date.now().toString(), name: '', candidates: [] },
    ]);
  };

  const removeRole = (roleId: string) => {
    if (roles.length > 1) {
      setRoles(roles.filter((r) => r.id !== roleId));
    }
  };

  const updateRoleName = (roleId: string, name: string) => {
    setRoles(
      roles.map((r) => (r.id === roleId ? { ...r, name } : r))
    );
  };

  const addCandidate = (roleId: string) => {
    setRoles(
      roles.map((r) =>
        r.id === roleId
          ? {
              ...r,
              candidates: [
                ...r.candidates,
                { id: Date.now().toString(), name: '', imageUrl: '', logoUrl: '' },
              ],
            }
          : r
      )
    );
  };

  const removeCandidate = (roleId: string, candidateId: string) => {
    setRoles(
      roles.map((r) =>
        r.id === roleId
          ? {
              ...r,
              candidates: r.candidates.filter((c) => c.id !== candidateId),
            }
          : r
      )
    );
  };

  const updateCandidate = (
    roleId: string,
    candidateId: string,
    field: 'name' | 'imageUrl' | 'logoUrl',
    value: string
  ) => {
    setRoles(
      roles.map((r) =>
        r.id === roleId
          ? {
              ...r,
              candidates: r.candidates.map((c) =>
                c.id === candidateId ? { ...c, [field]: value } : c
              ),
            }
          : r
      )
    );
  };

  const handleImageUpload = async (
    roleId: string,
    candidateId: string,
    file: File,
    field: 'imageUrl' | 'logoUrl'
  ) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `candidates/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        });

      if (uploadError) {
        console.error('Supabase upload error details:', uploadError);
        throw uploadError;
      }

      const { data: publicData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      const publicUrl = (publicData && (publicData as any).publicUrl) || '';

      if (!publicUrl) {
        console.error('Failed to get public URL after upload', { uploadData, publicData });
        throw new Error('Failed to obtain public URL for uploaded file');
      }

      updateCandidate(roleId, candidateId, field, publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      const message = (err as any)?.message || (err as any)?.error || JSON.stringify(err);
      alert(`Failed to upload image. ${message}`);
    }
  };

  const validateInputs = () => {
    if (!teacherId) {
      setError('You must be logged in to create a poll');
      return false;
    }

    if (!title.trim()) {
      setError('Please enter a poll title');
      return false;
    }

    if (title.length > 255) {
      setError('Title must be less than 255 characters');
      return false;
    }

    if (description.length > 1000) {
      setError('Description must be less than 1000 characters');
      return false;
    }

    if (roles.length === 0) {
      setError('Please add at least one role');
      return false;
    }

    for (const role of roles) {
      if (!role.name.trim()) {
        setError('All roles must have a name');
        return false;
      }
      if (role.candidates.length === 0) {
        setError(`Role "${role.name}" must have at least one candidate`);
        return false;
      }
      for (const candidate of role.candidates) {
        if (!candidate.name.trim()) {
          setError(`All candidates in "${role.name}" must have a name`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateInputs()) return;

    setIsSubmitting(true);

    try {
      if (!teacherId) {
        setError('You must be logged in to create a poll');
        setIsSubmitting(false);
        return;
      }

      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title,
          description,
          created_by: teacherId,
          is_active: true,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      for (const role of roles) {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .insert({
            poll_id: poll.id,
            name: role.name,
          })
          .select()
          .single();

        if (roleError) throw roleError;

        for (const candidate of role.candidates) {
          const { error: candidateError } = await supabase
            .from('candidates')
            .insert({
              role_id: roleData.id,
              name: candidate.name,
              image_url: candidate.imageUrl,
              logo_url: candidate.logoUrl,
            });

          if (candidateError) throw candidateError;
        }
      }

      alert('Poll created successfully!');
      onBack();
    } catch (err) {
      console.error('Error creating poll:', err);
      const message =
        (err as any)?.message ||
        (err as any)?.error ||
        JSON.stringify(err);
      setError(message || 'Failed to create poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Header />
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Poll title"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Write a short description"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {roles.map((role) => (
              <div
                key={role.id}
                className="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={role.name}
                    onChange={(e) =>
                      updateRoleName(role.id, e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Role name *"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => removeRole(role.id)}
                    disabled={roles.length <= 1 || isSubmitting}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {role.candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex flex-col gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="text"
                        value={candidate.name}
                        onChange={(e) =>
                          updateCandidate(
                            role.id,
                            candidate.id,
                            'name',
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Candidate name *"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          removeCandidate(role.id, candidate.id)
                        }
                        disabled={isSubmitting}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={candidate.imageUrl}
                        onChange={(e) =>
                          updateCandidate(
                            role.id,
                            candidate.id,
                            'imageUrl',
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        placeholder="Image URL (candidate picture)"
                        disabled={isSubmitting}
                      />
                      <label className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg cursor-pointer transition text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Upload className="w-4 h-4" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isSubmitting}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(
                                role.id,
                                candidate.id,
                                file,
                                'imageUrl'
                              );
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={candidate.logoUrl}
                        onChange={(e) =>
                          updateCandidate(
                            role.id,
                            candidate.id,
                            'logoUrl',
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        placeholder="Logo URL (candidate logo)"
                        disabled={isSubmitting}
                      />
                      <label className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg cursor-pointer transition text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Upload className="w-4 h-4" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isSubmitting}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(
                                role.id,
                                candidate.id,
                                file,
                                'logoUrl'
                              );
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex gap-2">
                      {candidate.imageUrl && (
                        <img
                          src={candidate.imageUrl}
                          alt={`${candidate.name} picture`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      {candidate.logoUrl && (
                        <img
                          src={candidate.logoUrl}
                          alt={`${candidate.name} logo`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addCandidate(role.id)}
                  disabled={isSubmitting}
                  className="mt-2 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add candidate
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addRole}
              disabled={isSubmitting}
              className="flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add role
            </button>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Publishing...' : 'Publish poll'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

