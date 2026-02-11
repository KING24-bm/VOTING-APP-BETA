import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  imageUrl: string;
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
    setRoles(roles.filter((r) => r.id !== roleId));
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
                { id: Date.now().toString(), name: '', imageUrl: '' },
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
    field: 'name' | 'imageUrl',
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
    file: File
  ) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `candidates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      updateCandidate(roleId, candidateId, 'imageUrl', data.publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!teacherId) {
      setError('You must be logged in as a teacher to publish a poll.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a poll title');
      return;
    }

    if (roles.length === 0) {
      setError('Please add at least one role');
      return;
    }

    for (const role of roles) {
      if (!role.name.trim()) {
        setError('All roles must have a name');
        return;
      }
      if (role.candidates.length === 0) {
        setError(`Role "${role.name}" must have at least one candidate`);
        return;
      }
      for (const candidate of role.candidates) {
        if (!candidate.name.trim()) {
          setError(`All candidates in "${role.name}" must have a name`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
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
            });

          if (candidateError) throw candidateError;
        }
      }

      alert('Poll created successfully!');
      onBack();
    } catch (err) {
      console.error('Error creating poll:', err);
      // Surface Supabase error message when available
      const message = (err as any)?.message || (err as any)?.error || JSON.stringify(err);
      setError(message || 'Failed to create poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <img src="/images/euroschool-logo.png" alt="EuroSchool North Campus" className="h-16 w-16 object-contain mb-8" />
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Poll</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poll Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Student Council Elections 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add a description for this poll..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Roles & Candidates</h2>
                <button
                  type="button"
                  onClick={addRole}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-5 h-5" />
                  Add Role
                </button>
              </div>

              {roles.map((role, roleIndex) => (
                <div
                  key={role.id}
                  className="border-2 border-gray-200 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role Name
                      </label>
                      <input
                        type="text"
                        value={role.name}
                        onChange={(e) => updateRoleName(role.id, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Head Boy, Head Girl, Sports Captain"
                      />
                    </div>
                    {roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRole(role.id)}
                        className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-700">Candidates</h3>
                      <button
                        type="button"
                        onClick={() => addCandidate(role.id)}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <Plus className="w-4 h-4" />
                        Add Candidate
                      </button>
                    </div>

                    {role.candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg"
                      >
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={candidate.name}
                            onChange={(e) =>
                              updateCandidate(role.id, candidate.id, 'name', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Candidate name"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={candidate.imageUrl}
                              onChange={(e) =>
                                updateCandidate(role.id, candidate.id, 'imageUrl', e.target.value)
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Image URL (paste link or upload)"
                            />
                            <label className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg cursor-pointer transition text-sm">
                              <Upload className="w-4 h-4" />
                              Upload
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(role.id, candidate.id, file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        {candidate.imageUrl && (
                          <img
                            src={candidate.imageUrl}
                            alt={candidate.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeCandidate(role.id, candidate.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}

                    {role.candidates.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No candidates added yet. Click "Add Candidate" to start.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Poll'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
