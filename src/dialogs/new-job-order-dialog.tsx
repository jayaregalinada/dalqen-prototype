import { IconArrowRight } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { NewOrderInput } from '../shared/types';
import { OverviewEditor } from '../ui/overview-editor';

const ADD_OPTION = '__add';

type FormState = {
  customer: string;
  title: string;
  dueDate: string;
  priority: 'Normal' | 'Urgent';
  contact: string;
  category: string;
  orderType: string;
  overview: string;
};

const defaultDueDate = () => new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

type DialogProps = {
  close: () => void;
  create: (input: NewOrderInput) => void;
  categories: string[];
  orderTypes: Record<string, string[]>;
  addCategory: (name: string) => void;
  addOrderType: (category: string, name: string) => void;
};

export function NewJobOrderDialog({ close, create, categories, orderTypes, addCategory, addOrderType }: DialogProps) {
  const [form, setForm] = useState<FormState>({
    customer: '',
    title: '',
    dueDate: defaultDueDate(),
    priority: 'Normal',
    contact: '',
    category: 'Apparel',
    orderType: 'Jersey Set',
    overview: '',
  });
  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const onCategoryChange = (value: string) => {
    if (value === ADD_OPTION) {
      const name = window.prompt('New category name');
      if (name?.trim()) {
        addCategory(name.trim());
        set('category', name.trim());
        set('orderType', '');
      }
      return;
    }
    set('category', value);
    set('orderType', orderTypes[value]?.[0] ?? '');
  };

  const onOrderTypeChange = (value: string) => {
    if (value === ADD_OPTION) {
      const name = window.prompt(`New order type for "${form.category}"`);
      if (name?.trim()) {
        addOrderType(form.category, name.trim());
        set('orderType', name.trim());
      }
      return;
    }
    set('orderType', value);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    create({
      customer: form.customer,
      title: form.title,
      dueDate: form.dueDate,
      priority: form.priority,
      contact: form.contact,
      category: form.category,
      orderType: form.orderType,
      overview: form.overview,
      projects: [],
    });
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-[920px]" showCloseButton>
        <form onSubmit={submit}>
          <DialogHeader>
            <span className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">First production record</span>
            <DialogTitle>Create a job order</DialogTitle>
            <DialogDescription>Start with the customer and describe the work in the overview. Projects can be added afterwards.</DialogDescription>
          </DialogHeader>
          <div className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <Label className="col-span-1">Customer<Input required autoFocus value={form.customer} onChange={(e) => set('customer', e.target.value)} placeholder="Customer or organization" /></Label>
            <Label>Order title<Input required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="What is this job for?" /></Label>
            <Label>Category
              <Select value={form.category} onValueChange={(v) => onCategoryChange(v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  <SelectItem value={ADD_OPTION}>+ Add new category…</SelectItem>
                </SelectContent>
              </Select>
            </Label>
            <Label>Order type
              <Select value={form.orderType} onValueChange={(v) => onOrderTypeChange(v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(orderTypes[form.category] ?? []).map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  <SelectItem value={ADD_OPTION}>+ Add new order type…</SelectItem>
                </SelectContent>
              </Select>
            </Label>
            <Label>Contact<Input value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="FB name, email, link, or number" /></Label>
            <Label>Due date<Input required type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></Label>
            <Label>Priority
              <Select value={form.priority} onValueChange={(v) => set('priority', (v ?? 'Normal') as 'Normal' | 'Urgent')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </Label>
          </div>
          <div className="mt-4 grid gap-1.5">
            <span className="text-xs font-bold text-foreground">Overview</span>
            <OverviewEditor initialHtml="" onChange={(html) => set('overview', html)} boxed />
          </div>
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit">Create job order <IconArrowRight size={16} /></Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}