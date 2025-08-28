import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface ChangePasswordProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ oldPassword?: string; newPassword?: string }>({});

  const validate = () => {
    const nextErrors: { oldPassword?: string; newPassword?: string } = {};
    if (!currentPassword) nextErrors.oldPassword = 'Old password is required';

    const hasLower = /[a-z]/.test(newPassword);
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasLength = newPassword.length >= 8;
    if (!newPassword) {
      nextErrors.newPassword = 'New password is required';
    } else if (!(hasLower && hasUpper && hasNumber && hasLength)) {
      nextErrors.newPassword = 'Min 8 chars with lowercase, uppercase and a number';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Failed to change password');
      }

      toast({
        title: 'Password updated',
        description: 'Your password was changed successfully.',
        duration: 5000,
        className: 'bg-green-500 text-white',
      });
      
      setCurrentPassword('');
      setNewPassword('');
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Please verify your old password and try again.';
      toast({
        title: 'Update failed',
        description: errorMessage,
        duration: 5000,
        className: 'bg-red-500 text-white',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old-password">Current Password</Label>
            <Input
              id="old-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
            />
            {errors.oldPassword && (
              <p className="text-xs text-destructive">{errors.oldPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 chars, upper, lower, number"
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePassword;


