import { IconArrowRight } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { NewOrderInput } from '../shared/types';
import { OverviewEditor } from '../ui/overview-editor';
import { TextPromptDialog } from '../ui/text-prompt-dialog';

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

type OptionPrompt =
  | { kind: 'category' }
  | { kind: 'orderType'; category: string }
  | null;

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
  const [optionPrompt, setOptionPrompt] = useState<OptionPrompt>(null);
  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const onCategoryChange = (value: string) => {
    if (!value) return;
    if (value === ADD_OPTION) {
      setOptionPrompt({ kind: 'category' });
      return;
    }
    set('category', value);
    set('orderType', orderTypes[value]?.[0] ?? '');
  };

  const onOrderTypeChange = (value: string) => {
    if (!value) return;
    if (value === ADD_OPTION) {
      setOptionPrompt({ kind: 'orderType', category: form.category });
      return;
    }
    set('orderType', value);
  };

  const submitOption = (name: string) => {
    if (optionPrompt?.kind === 'category') {
      addCategory(name);
      set('category', name);
      set('orderType', '');
    } else if (optionPrompt?.kind === 'orderType') {
      addOrderType(optionPrompt.category, name);
      set('orderType', name);
    }
    setOptionPrompt(null);
  };

  const categoryOptions = form.category && !categories.includes(form.category) ? [...categories, form.category] : categories;
  const availableOrderTypes = orderTypes[form.category] ?? [];
  const orderTypeOptions = form.orderType && !availableOrderTypes.includes(form.orderType) ? [...availableOrderTypes, form.orderType] : availableOrderTypes;

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
    <>
      <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-[920px]" showCloseButton>
        <form onSubmit={submit}>
          <DialogHeader>
            <span className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">First production record</span>
            <DialogTitle>Create a job order</DialogTitle>
            <DialogDescription>Start with the customer and describe the work in the overview. Projects can be added afterwards.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="mt-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <Field>
              <FieldLabel htmlFor="new-order-customer">Customer</FieldLabel>
              <Input id="new-order-customer" required autoFocus value={form.customer} onChange={(event) => set('customer', event.target.value)} placeholder="Customer or organization" />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-order-title">Order title</FieldLabel>
              <Input id="new-order-title" required value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="What is this job for?" />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-order-category">Category</FieldLabel>
              <Select value={form.category} onValueChange={onCategoryChange}>
                <SelectTrigger id="new-order-category" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  <SelectItem value={ADD_OPTION}>+ Add new category…</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="new-order-type">Order type</FieldLabel>
              <Select value={form.orderType} onValueChange={onOrderTypeChange}>
                <SelectTrigger id="new-order-type" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {orderTypeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  <SelectItem value={ADD_OPTION}>+ Add new order type…</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="new-order-contact">Contact</FieldLabel>
              <Input id="new-order-contact" value={form.contact} onChange={(event) => set('contact', event.target.value)} placeholder="FB name, email, link, or number" />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-order-due-date">Due date</FieldLabel>
              <Input id="new-order-due-date" required type="date" value={form.dueDate} onChange={(event) => set('dueDate', event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-order-priority">Priority</FieldLabel>
              <Select value={form.priority} onValueChange={(value) => set('priority', value as 'Normal' | 'Urgent')}>
                <SelectTrigger id="new-order-priority" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <Field className="mt-4">
            <FieldLabel>Overview</FieldLabel>
            <OverviewEditor initialHtml="" onChange={(html) => set('overview', html)} boxed />
          </Field>
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit">Create job order <IconArrowRight size={16} /></Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
      <TextPromptDialog
        open={optionPrompt !== null}
        title={optionPrompt?.kind === 'orderType' ? 'Add order type' : 'Add category'}
        description={optionPrompt?.kind === 'orderType' ? `Add an order type for ${optionPrompt.category}.` : 'Add a category to the shared workspace.'}
        label={optionPrompt?.kind === 'orderType' ? 'Order type name' : 'Category name'}
        submitLabel="Add"
        onOpenChange={(open) => { if (!open) setOptionPrompt(null); }}
        onSubmit={submitOption}
      />
    </>
  );
}