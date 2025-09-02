import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [formData, setFormData] = useState({
    key: "",
    description: "",
    monthlyLimit: "500",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: { key: string; description?: string; monthlyLimit: number }) => {
      const response = await apiRequest('POST', '/api/api-keys', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "API Key Added",
        description: "API key has been added successfully",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add API Key",
        description: error.message || "Failed to add API key",
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.key.trim()) {
      newErrors.key = "API key is required";
    } else if (formData.key.length < 20) {
      newErrors.key = "API key appears to be too short";
    }

    const monthlyLimit = parseInt(formData.monthlyLimit);
    if (isNaN(monthlyLimit) || monthlyLimit <= 0) {
      newErrors.monthlyLimit = "Monthly limit must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    createMutation.mutate({
      key: formData.key.trim(),
      description: formData.description.trim() || undefined,
      monthlyLimit: parseInt(formData.monthlyLimit),
    });
  };

  const handleClose = () => {
    setFormData({ key: "", description: "", monthlyLimit: "500" });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="api-key-modal">
        <DialogHeader>
          <DialogTitle>Add New API Key</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="apiKey" className="text-sm font-medium">
              API Key *
            </Label>
            <Input
              id="apiKey"
              type="text"
              placeholder="Enter TinyPNG API key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className={errors.key ? "border-destructive" : ""}
              data-testid="input-api-key"
            />
            {errors.key && (
              <p className="text-sm text-destructive mt-1">{errors.key}</p>
            )}
          </div>

          <div>
            <Label htmlFor="monthlyLimit" className="text-sm font-medium">
              Monthly Limit
            </Label>
            <Input
              id="monthlyLimit"
              type="number"
              placeholder="500"
              value={formData.monthlyLimit}
              onChange={(e) => setFormData({ ...formData, monthlyLimit: e.target.value })}
              className={errors.monthlyLimit ? "border-destructive" : ""}
              data-testid="input-monthly-limit"
            />
            {errors.monthlyLimit && (
              <p className="text-sm text-destructive mt-1">{errors.monthlyLimit}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="Production API key"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              data-testid="input-description"
            />
          </div>

          <DialogFooter className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleClose}
              disabled={createMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-save"
            >
              {createMutation.isPending ? "Adding..." : "Add API Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
