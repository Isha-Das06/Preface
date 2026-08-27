/**
 * Single import surface for the design system.
 *
 * Screens import from here and nowhere else. If a screen needs
 * something new: check whether an existing component covers it,
 * then extend the system here. Never style inline in a page file —
 * that is how a product stops looking like one product.
 */

export { Button, type ButtonProps } from "./button";
export { Field, Label, controlClasses, useField } from "./field";
export { Input, Textarea, type InputProps } from "./input";
export { Checkbox } from "./checkbox";
export { RadioGroup, Radio, RadioCard } from "./radio";
export {
  Select,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectGroup,
} from "./select";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
} from "./card";
export {
  Badge,
  StatusBadge,
  StatusDot,
  type OnboardingStatus,
} from "./badge";
export { Avatar, Divider } from "./avatar";
export { PageHeader } from "./page-header";
export { Logo } from "./logo";

export {
  ProgressBar,
  ProgressSummary,
  StepList,
  type Step,
  type StepState,
} from "./progress";

export { Table, THead, TBody, TR, TH, TD } from "./table";
export { EmptyState, ErrorState, Skeleton, SkeletonText } from "./states";

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  Modal,
  SlideOver,
} from "./dialog";
export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuLabel,
  Tooltip,
  TooltipProvider,
} from "./menu";
export { Toaster, toast } from "./toast";
export { PendingButton, ToastButton } from "./action-button";
