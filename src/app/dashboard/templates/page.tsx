'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Copy,
  Eye,
  Save,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import type { EmailTemplate, TemplateCategory } from '@/types';

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'introduction', label: 'Introduction' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'custom', label: 'Custom' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isNewTemplate, setIsNewTemplate] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    bodyHtml: '',
    bodyText: '',
    category: 'custom' as TemplateCategory,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (template?: EmailTemplate) => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
        category: template.category,
      });
      setEditingTemplate(template);
      setIsNewTemplate(false);
    } else {
      setFormData({
        name: '',
        subject: '',
        bodyHtml: '',
        bodyText: '',
        category: 'custom',
      });
      setEditingTemplate(null);
      setIsNewTemplate(true);
    }
  };

  const closeEditor = () => {
    setEditingTemplate(null);
    setIsNewTemplate(false);
  };

  const saveTemplate = async () => {
    if (!formData.name || !formData.subject || !formData.bodyHtml) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const url = editingTemplate
        ? `/api/templates?id=${editingTemplate.id}`
        : '/api/templates';
      const method = editingTemplate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        if (editingTemplate) {
          setTemplates(
            templates.map((t) => (t.id === editingTemplate.id ? data.data : t))
          );
        } else {
          setTemplates([data.data, ...templates]);
        }
        closeEditor();
        toast({
          title: 'Saved',
          description: `Template "${formData.name}" has been saved.`,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save template',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to save:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/templates?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(templates.filter((t) => t.id !== id));
        toast({
          title: 'Deleted',
          description: 'Template has been removed.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Cannot delete default templates',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const duplicateTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/templates?action=duplicate&id=${id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setTemplates([data.data, ...templates]);
        toast({
          title: 'Duplicated',
          description: 'Template has been copied.',
        });
      }
    } catch (error) {
      console.error('Failed to duplicate:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Editor view
  if (editingTemplate || isNewTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </h1>
            <p className="text-muted-foreground">
              {editingTemplate
                ? 'Modify your email template'
                : 'Create a new email template'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeEditor}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={saveTemplate} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Template name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as TemplateCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Subject *</label>
                <Input
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Email subject (use {{variable}} for personalization)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Body (HTML) *</label>
                <Textarea
                  value={formData.bodyHtml}
                  onChange={(e) =>
                    setFormData({ ...formData, bodyHtml: e.target.value })
                  }
                  placeholder="<p>Hello {{name}},</p>..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Available Variables:</p>
                <p className="text-xs text-muted-foreground">
                  Use double curly braces for variables like{' '}
                  <code className="bg-background px-1 rounded">{'{{name}}'}</code>,{' '}
                  <code className="bg-background px-1 rounded">{'{{email}}'}</code>,{' '}
                  <code className="bg-background px-1 rounded">{'{{company}}'}</code>.
                  These will be replaced with data from your uploaded Excel file.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white text-black min-h-[400px]">
                <div className="border-b pb-2 mb-4">
                  <p className="text-sm text-gray-500">Subject:</p>
                  <p className="font-medium">
                    {formData.subject.replace(/\{\{(\w+)\}\}/g, '[$1]') || '(No subject)'}
                  </p>
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      formData.bodyHtml.replace(/\{\{(\w+)\}\}/g, '<span class="bg-yellow-200 px-1">[$1]</span>') ||
                      '<p class="text-gray-400">(No content)</p>',
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage your email templates
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{template.category}</Badge>
                    {template.isDefault && (
                      <Badge variant="outline">Default</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground truncate mb-2">
                Subject: {template.subject}
              </p>
              <div
                className="text-sm text-muted-foreground line-clamp-3 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: template.bodyHtml.substring(0, 200) + '...',
                }}
              />
            </CardContent>
            <div className="p-4 pt-0 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setPreviewTemplate(template)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => openEditor(template)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => duplicateTemplate(template.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              {!template.isDefault && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{template.name}&quot;? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteTemplate(template.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white text-black max-h-[60vh] overflow-y-auto">
            <div className="border-b pb-2 mb-4">
              <p className="text-sm text-gray-500">Subject:</p>
              <p className="font-medium">
                {previewTemplate?.subject.replace(/\{\{(\w+)\}\}/g, '[$1]')}
              </p>
            </div>
            <div
              dangerouslySetInnerHTML={{
                __html:
                  previewTemplate?.bodyHtml.replace(
                    /\{\{(\w+)\}\}/g,
                    '<span class="bg-yellow-200 px-1">[$1]</span>'
                  ) || '',
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
