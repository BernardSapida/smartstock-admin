# Component Patterns

How to use HeroUI v3 components correctly with Tailwind v4. HeroUI provides the structure and base states — your job is to apply design principles on top: correct hierarchy, spacing, color discipline, and consistency.

---

## HeroUI v3 core philosophy

HeroUI v3 is built on:
- **React Aria** — accessibility primitives baked in
- **Tailwind v4** — styling via `className` and the `cn()` utility
- **Framer Motion** — animations handled automatically
- **CSS variables** — theme via `@theme` in your CSS

Always prefer HeroUI components over building from scratch. They handle: focus management, keyboard navigation, ARIA roles, animation, and dark mode automatically.

---

## Buttons

HeroUI `Button` covers all variants. Use the right variant for the right hierarchy level.

```jsx
import { Button } from "@heroui/react";

// Primary CTA — ONE per screen section maximum
<Button color="primary" size="md">
  Create project
</Button>

// Secondary — supporting action
<Button variant="bordered" color="primary" size="md">
  Learn more
</Button>

// Ghost / tertiary — least important
<Button variant="light" color="default" size="md">
  Cancel
</Button>

// Danger — destructive actions ONLY
<Button color="danger" variant="flat">
  Delete account
</Button>

// Icon button — always add aria-label
<Button isIconOnly variant="light" aria-label="Settings">
  <SettingsIcon />
</Button>
```

**Button hierarchy rules:**
- One `color="primary"` (solid) per screen section — the primary CTA
- Secondary actions use `variant="bordered"` or `variant="flat"`
- Tertiary actions are `variant="light"` or plain text links
- Never two solid primary buttons side by side — one of them is wrong
- Loading state: use `isLoading` prop — built in, no custom spinner needed

```jsx
// Loading state — built into HeroUI
<Button color="primary" isLoading={isSubmitting}>
  {isSubmitting ? "Saving..." : "Save changes"}
</Button>

// Disabled state
<Button color="primary" isDisabled={!isValid}>
  Submit
</Button>
```

**Button sizing:**
- `size="sm"` — inline actions, table rows, compact UIs
- `size="md"` — default; forms, cards, most contexts
- `size="lg"` — hero CTAs, prominent landing page actions

---

## Forms and inputs

HeroUI provides: `Input`, `Textarea`, `Select`, `Checkbox`, `CheckboxGroup`, `Radio`, `RadioGroup`, `Switch`, `Slider`.

```jsx
import { Input, Select, SelectItem } from "@heroui/react";

// Standard input with label and validation
<Input
  label="Email address"
  placeholder="you@example.com"
  type="email"
  isRequired
  errorMessage={errors.email}
  isInvalid={!!errors.email}
  description="We'll never share your email"
/>

// Select dropdown
<Select label="Role" placeholder="Select a role">
  <SelectItem key="designer">Designer</SelectItem>
  <SelectItem key="developer">Developer</SelectItem>
  <SelectItem key="manager">Product Manager</SelectItem>
</Select>
```

**Form layout rules:**

```jsx
// Single-column form (mobile default, good for most forms)
<form className="flex flex-col gap-4 max-w-md">
  <Input label="Full name" />
  <Input label="Email address" type="email" />
  <Input label="Password" type="password" />
  <Button color="primary" type="submit" fullWidth>
    Create account
  </Button>
</form>

// Two-column form (desktop, for longer forms)
<form className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
  <Input label="First name" />
  <Input label="Last name" />
  <Input label="Email" className="md:col-span-2" />
  <Button color="primary" type="submit" className="md:col-span-2">
    Save
  </Button>
</form>
```

**Validation patterns — always inline, never modal:**
```jsx
// Error below the field that caused it — never above, never in a toast
<Input
  label="Password"
  type="password"
  isInvalid={password.length < 8}
  errorMessage="Password must be at least 8 characters"
/>

// Success state
<Input
  label="Username"
  isValid={isAvailable}
  description={isAvailable ? "✓ Username available" : ""}
/>
```

**Selection over text input (UX principle):**
```jsx
// Prefer RadioGroup + Radio over free-text for fixed options
import { RadioGroup, Radio } from "@heroui/react";

<RadioGroup label="Your role" orientation="horizontal">
  <Radio value="designer">🎨 Designer</Radio>
  <Radio value="developer">🧑‍💻 Developer</Radio>
  <Radio value="manager">📊 Manager</Radio>
  <Radio value="other">Other</Radio>
</RadioGroup>

// Prefer Checkbox for multi-select
import { CheckboxGroup, Checkbox } from "@heroui/react";

<CheckboxGroup label="Notifications">
  <Checkbox value="email">Email</Checkbox>
  <Checkbox value="push">Push</Checkbox>
  <Checkbox value="sms">SMS</Checkbox>
</CheckboxGroup>
```

---

## Navigation

### Top navigation bar
```jsx
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button } from "@heroui/react";

<Navbar isBordered>
  <NavbarBrand>
    <Logo />
    <p className="font-semibold text-inherit">AppName</p>
  </NavbarBrand>

  {/* Center links — hidden on mobile */}
  <NavbarContent className="hidden md:flex gap-6" justify="center">
    <NavbarItem>
      <Link href="/features" color="foreground">Features</Link>
    </NavbarItem>
    <NavbarItem isActive>
      <Link href="/pricing" aria-current="page">Pricing</Link>
    </NavbarItem>
  </NavbarContent>

  {/* Right side actions */}
  <NavbarContent justify="end">
    <NavbarItem className="hidden md:flex">
      <Link href="/login">Sign in</Link>
    </NavbarItem>
    <NavbarItem>
      <Button color="primary" size="sm">Get started</Button>
    </NavbarItem>
  </NavbarContent>
</Navbar>
```

### Tabs
```jsx
import { Tabs, Tab } from "@heroui/react";

// Horizontal tabs (default) — for switching views
<Tabs aria-label="Options" color="primary" variant="underlined">
  <Tab key="overview" title="Overview">
    <OverviewContent />
  </Tab>
  <Tab key="analytics" title="Analytics">
    <AnalyticsContent />
  </Tab>
  <Tab key="settings" title="Settings">
    <SettingsContent />
  </Tab>
</Tabs>
```

### Breadcrumbs
```jsx
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";

// Always use when the user navigated to a new page from a dashboard
<Breadcrumbs>
  <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/dashboard/projects">Projects</BreadcrumbItem>
  <BreadcrumbItem>Project Alpha</BreadcrumbItem>
</Breadcrumbs>
```

---

## Cards

```jsx
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/react";

// Standard content card
<Card className="max-w-sm">
  <CardHeader className="flex gap-3">
    <Avatar src={user.avatar} />
    <div>
      <p className="text-sm font-medium">{user.name}</p>
      <p className="text-xs text-default-500">{user.role}</p>
    </div>
  </CardHeader>
  <CardBody>
    <p className="text-sm text-default-700">{content}</p>
  </CardBody>
  <CardFooter className="gap-2">
    <Button size="sm" color="primary">Follow</Button>
    <Button size="sm" variant="bordered">Message</Button>
  </CardFooter>
</Card>

// Metric/stat card — number prominent, label secondary
<Card className="p-4">
  <CardBody className="gap-1">
    <p className="text-3xl font-semibold">2,841</p>
    <p className="text-sm text-default-500">Total visitors</p>
    <p className="text-xs text-success-600">↑ 12% from last week</p>
  </CardBody>
</Card>
```

**Card design rules:**
- Card padding: use HeroUI default (handles it) or add `className="p-4"` / `p-6`
- Metric cards: number first (large, prominent), label second (small, muted)
- Never put two primary buttons inside one card
- Card borders vs shadow: HeroUI handles this — use `shadow="sm"` for subtle lift

---

## Modals and Drawers

```jsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@heroui/react";

const { isOpen, onOpen, onOpenChange } = useDisclosure();

// Trigger
<Button onPress={onOpen}>Create project</Button>

// Modal
<Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader>Create new project</ModalHeader>
        <ModalBody>
          <Input label="Project name" />
          <Textarea label="Description" />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleCreate}>Create</Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>
```

**Modal rules:**
- Always: primary action button + cancel/close button
- Primary action on the right, cancel on the left
- Follow with a toast on success
- Modal size: `sm` for simple confirmations, `md` default, `lg` for complex forms

---

## Toast / Alerts

```jsx
// HeroUI uses Sonner or react-hot-toast for toasts (not built-in)
// Recommended: use Sonner with HeroUI
import { toast } from "sonner";

// After successful action
toast.success("Project created successfully");
toast.error("Failed to create project. Please try again.");
toast.loading("Creating project...");

// HeroUI Alert component (inline, not floating)
import { Alert } from "@heroui/react";

<Alert color="success" title="Changes saved" description="Your profile has been updated." />
<Alert color="danger" title="Error" description="Something went wrong. Please try again." />
<Alert color="warning" title="Warning" description="This action cannot be undone." />
```

---

## Tables

```jsx
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";

<Table aria-label="Projects table" selectionMode="multiple">
  <TableHeader>
    <TableColumn>Name</TableColumn>
    <TableColumn>Status</TableColumn>
    <TableColumn>Created</TableColumn>
    <TableColumn>Actions</TableColumn>
  </TableHeader>
  <TableBody>
    {projects.map((project) => (
      <TableRow key={project.id}>
        <TableCell>{project.name}</TableCell>
        <TableCell>
          <Chip color={statusColor[project.status]} size="sm" variant="flat">
            {project.status}
          </Chip>
        </TableCell>
        <TableCell className="text-default-500 text-sm">{project.date}</TableCell>
        <TableCell>
          <Button isIconOnly size="sm" variant="light" aria-label="Options">
            <DotsIcon />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Chips and Badges

```jsx
import { Chip, Badge } from "@heroui/react";

// Status chip — flat variant, semantic color
<Chip color="success" variant="flat" size="sm">Active</Chip>
<Chip color="warning" variant="flat" size="sm">Pending</Chip>
<Chip color="danger" variant="flat" size="sm">Error</Chip>
<Chip color="default" variant="flat" size="sm">Draft</Chip>

// Badge for notification counts
<Badge content="3" color="danger">
  <BellIcon />
</Badge>
```

**Color rule:** Chips and badges follow system colors — green=success, red=danger, yellow=warning, blue=info. Never use accent/brand color for status chips.

---

## Avatar and User display

```jsx
import { Avatar, AvatarGroup, User } from "@heroui/react";

// Single avatar
<Avatar src={user.avatar} name={user.name} size="md" />

// Avatar with fallback initials (when no image)
<Avatar name="John Doe" />  // renders "JD" with auto color

// User display component (avatar + name + description)
<User
  name="John Doe"
  description="Product Designer"
  avatarProps={{ src: user.avatar }}
/>

// Avatar group for collaborative UIs
<AvatarGroup max={3}>
  {members.map(m => <Avatar key={m.id} src={m.avatar} name={m.name} />)}
</AvatarGroup>
```

---

## Dropdown and Context menus

```jsx
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";

<Dropdown>
  <DropdownTrigger>
    <Button variant="light" isIconOnly aria-label="More options">
      <DotsVerticalIcon />
    </Button>
  </DropdownTrigger>
  <DropdownMenu aria-label="Actions">
    <DropdownItem key="edit">Edit</DropdownItem>
    <DropdownItem key="duplicate">Duplicate</DropdownItem>
    <DropdownItem key="share">Share</DropdownItem>
    <DropdownItem key="delete" color="danger" className="text-danger">
      Delete
    </DropdownItem>
  </DropdownMenu>
</Dropdown>
```

**Rule:** Destructive actions go last in dropdowns, always in `color="danger"`.

---

## Skeleton loading states

```jsx
import { Skeleton, Card, CardBody } from "@heroui/react";

// Prefer skeleton screens over spinners for content areas
<Card>
  <CardBody className="flex gap-3">
    <Skeleton className="rounded-full w-10 h-10" />
    <div className="flex flex-col gap-2 flex-1">
      <Skeleton className="h-4 w-3/4 rounded-lg" />
      <Skeleton className="h-3 w-1/2 rounded-lg" />
    </div>
  </CardBody>
</Card>
```

Use skeleton screens when: content has a predictable shape and loading takes >300ms. Use spinners when: action is short (<300ms) or content shape is unpredictable.