import { Form, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronDown,
    Clock,
    Pencil,
    Plus,
    Tag,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import RoomRateController from '@/actions/App/Http/Controllers/Admin/RoomRateController';
import { ConfirmDelete } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { IconButton } from '@/components/icon-button';
import InputError from '@/components/input-error';
import { FormField } from '@/components/form-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatPeso } from '@/lib/format';
import { edit as settingsEdit } from '@/routes/admin/settings';
import type { RateUnitOption, RoomRate } from '@/types';

type DialogState = { rate: RoomRate | null; extension: boolean };

export function RoomRates({
    roomId,
    rates,
    rateUnits,
}: {
    roomId: number;
    rates: RoomRate[];
    rateUnits: RateUnitOption[];
}) {
    const [dialog, setDialog] = useState<DialogState | null>(null);
    const [deleting, setDeleting] = useState<RoomRate | null>(null);
    const hasExtensionRate = rates.some((rate) => rate.is_extension_rate);
    const hasStandardRate = rates.some((rate) => !rate.is_extension_rate);

    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
                <div className="min-w-0 space-y-1.5">
                    <CardTitle>Rates</CardTitle>
                    <CardDescription>
                        Prices you set for this room. Guests book standard
                        rates; the extension rate applies when a stay runs
                        longer.
                    </CardDescription>
                </div>
                {rates.length > 0 && (
                    <Button
                        size="sm"
                        onClick={() =>
                            setDialog({ rate: null, extension: false })
                        }
                    >
                        <Plus />
                        Add rate
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {rates.length === 0 ? (
                    <EmptyState
                        icon={Tag}
                        title="No rates yet"
                        description="Add at least one price, for example Overnight or Day tour. Guests cannot book the room without one."
                        className="py-8"
                        action={
                            <Button
                                onClick={() =>
                                    setDialog({ rate: null, extension: false })
                                }
                            >
                                <Plus />
                                Add rate
                            </Button>
                        }
                    />
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-0">Name</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">
                                        Price
                                    </TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="w-20">
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rates.map((rate) => (
                                    <TableRow key={rate.id}>
                                        <TableCell className="pl-0 font-medium">
                                            {rate.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {rate.unit}
                                        </TableCell>
                                        <TableCell className="text-right font-medium tabular-nums">
                                            {formatPeso(rate.price)}
                                        </TableCell>
                                        <TableCell>
                                            {rate.is_extension_rate ? (
                                                <Badge variant="outline">
                                                    <Clock />
                                                    Extension
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Standard
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="pr-0 text-right">
                                            <IconButton
                                                label={`Edit ${rate.name}`}
                                                onClick={() =>
                                                    setDialog({
                                                        rate,
                                                        extension:
                                                            rate.is_extension_rate,
                                                    })
                                                }
                                            >
                                                <Pencil />
                                            </IconButton>
                                            <IconButton
                                                label={`Delete ${rate.name}`}
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    setDeleting(rate)
                                                }
                                            >
                                                <Trash2 />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {!hasStandardRate && (
                            <div
                                role="alert"
                                className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
                            >
                                <span className="flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                    <span>
                                        <span className="font-medium">
                                            This room has no booking price.
                                        </span>{' '}
                                        Every rate here is an extension rate, so
                                        the room shows "No price yet" and cannot
                                        be booked. Edit a rate and set its type
                                        to Standard, or add one.
                                    </span>
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setDialog({
                                            rate: null,
                                            extension: false,
                                        })
                                    }
                                >
                                    <Plus />
                                    Add standard rate
                                </Button>
                            </div>
                        )}
                        {!hasExtensionRate && (
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3 text-sm">
                                <span className="text-muted-foreground">
                                    No extension rate yet. Reception needs it
                                    when a guest extends their stay.
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setDialog({
                                            rate: null,
                                            extension: true,
                                        })
                                    }
                                >
                                    <Clock />
                                    Add extension rate
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            <RateDialog
                roomId={roomId}
                state={dialog}
                rateUnits={rateUnits}
                existingNames={rates.map((rate) => rate.name)}
                onOpenChange={(open) => !open && setDialog(null)}
            />

            {deleting && (
                <ConfirmDelete
                    open
                    onOpenChange={(open) => !open && setDeleting(null)}
                    title={`Delete the ${deleting.name} rate?`}
                    description={`${formatPeso(deleting.price)} per ${deleting.unit.toLowerCase()} will no longer be offered for this room.`}
                    url={RoomRateController.destroy.url({
                        room: roomId,
                        rate: deleting.id,
                    })}
                />
            )}
        </Card>
    );
}

/** The two kinds of rate; the value is what `is_extension_rate` is sent as. */
const rateTypes = [
    {
        value: '0',
        label: 'Standard',
        description:
            'A booking price. Shown as the room price and offered when booking.',
    },
    {
        value: '1',
        label: 'Extension',
        description:
            'Charged only when a guest extends their stay. Not a booking price.',
    },
];

/** Common rate names offered in the Name list; any other name can be typed. */
const RATE_NAMES = [
    'Standard Rate',
    'Overnight',
    'Day Tour',
    'Weekend Rate',
    'Holiday Rate',
    'Peak Season Rate',
    'Off-Peak Rate',
    'Corporate Plan',
    'Long Stay',
    'Early Check-in',
    'Late Checkout',
    'Extension',
];

/**
 * The rate's name: a text box the Admin can type in, with a list of common
 * names (and the names already used on this room) to pick from.
 */
function RateNameInput({
    defaultValue,
    names,
}: {
    defaultValue: string;
    names: string[];
}) {
    const [value, setValue] = useState(defaultValue);
    const options = [...new Set([...RATE_NAMES, ...names])];

    return (
        <div className="flex gap-2">
            <Input
                id="rate-name"
                name="name"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Type a name or choose one"
                maxLength={255}
                required
                autoFocus
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Choose a rate name"
                    >
                        <ChevronDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="max-h-64 overflow-y-auto"
                >
                    {options.map((option) => (
                        <DropdownMenuItem
                            key={option}
                            onSelect={() => setValue(option)}
                        >
                            {option}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function RateDialog({
    roomId,
    state,
    rateUnits,
    existingNames,
    onOpenChange,
}: {
    roomId: number;
    state: DialogState | null;
    rateUnits: RateUnitOption[];
    existingNames: string[];
    onOpenChange: (open: boolean) => void;
}) {
    const rate = state?.rate ?? null;
    // New extension rates are usually per hour; standard rates per night.
    const suggestedName = state?.extension ? 'per hour' : 'overnight';
    const suggestedUnit = rateUnits
        .find((unit) => unit.name.toLowerCase() === suggestedName)
        ?.id.toString();

    return (
        <Dialog open={state !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {rate
                            ? 'Edit rate'
                            : state?.extension
                              ? 'Add extension rate'
                              : 'Add rate'}
                    </DialogTitle>
                    <DialogDescription>
                        Prices are entered by you; the system does not work them
                        out.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    key={rate?.id ?? `new-${state?.extension}`}
                    {...(rate
                        ? RoomRateController.update.form({
                              room: roomId,
                              rate: rate.id,
                          })
                        : RoomRateController.store.form(roomId))}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <FormField
                                label="Name"
                                htmlFor="rate-name"
                                error={errors.name}
                            >
                                <RateNameInput
                                    defaultValue={
                                        rate?.name ??
                                        (state?.extension ? 'Extension' : '')
                                    }
                                    names={existingNames}
                                />
                            </FormField>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    label="Price"
                                    htmlFor="rate-price"
                                    error={errors.price}
                                >
                                    <div className="relative">
                                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm leading-none text-muted-foreground">
                                            ₱
                                        </span>
                                        <Input
                                            id="rate-price"
                                            name="price"
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            step="0.01"
                                            defaultValue={rate?.price}
                                            placeholder="0.00"
                                            className="pl-7"
                                            required
                                        />
                                    </div>
                                </FormField>
                                <FormField
                                    label="Per"
                                    htmlFor="rate-unit"
                                    error={errors.rate_unit_id}
                                    hint={
                                        <Link
                                            href={settingsEdit()}
                                            className="underline-offset-4 hover:underline"
                                        >
                                            Add or rename units
                                        </Link>
                                    }
                                >
                                    <Select
                                        name="rate_unit_id"
                                        defaultValue={
                                            rate
                                                ? String(rate.rate_unit_id)
                                                : suggestedUnit
                                        }
                                        required
                                    >
                                        <SelectTrigger
                                            id="rate-unit"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Choose a unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rateUnits.map((unit) => (
                                                <SelectItem
                                                    key={unit.id}
                                                    value={String(unit.id)}
                                                >
                                                    {unit.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                            </div>

                            <fieldset className="grid gap-2">
                                <legend className="mb-2 text-sm font-medium">
                                    Type
                                </legend>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {rateTypes.map((type) => (
                                        <label
                                            key={type.value}
                                            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-primary/5"
                                        >
                                            <input
                                                type="radio"
                                                name="is_extension_rate"
                                                value={type.value}
                                                defaultChecked={
                                                    (rate?.is_extension_rate ??
                                                        state?.extension ??
                                                        false) ===
                                                    (type.value === '1')
                                                }
                                                className="mt-0.5 size-4 accent-primary"
                                            />
                                            <span className="grid gap-1">
                                                <span className="text-sm leading-none font-medium">
                                                    {type.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {type.description}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <InputError
                                    message={errors.is_extension_rate}
                                />
                            </fieldset>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    {rate ? 'Save changes' : 'Add rate'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
