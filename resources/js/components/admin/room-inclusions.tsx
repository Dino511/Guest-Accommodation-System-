import { Minus, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import RoomInclusionController from '@/actions/App/Http/Controllers/Admin/RoomInclusionController';
import { IconButton } from '@/components/icon-button';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { RoomInclusion } from '@/types';

const FAILED = 'Could not save. Check your connection and try again.';

function sorted(list: RoomInclusion[]): RoomInclusion[] {
    return [...list].sort((a, b) =>
        a.item.localeCompare(b.item, undefined, {
            numeric: true,
            sensitivity: 'base',
        }),
    );
}

/**
 * Saves one change in the background. The room page is not fetched again:
 * the card keeps its own list and the server answers with JSON only.
 * Returns the saved row (null for a delete); throws the message to show.
 */
async function save(
    method: 'POST' | 'PATCH' | 'DELETE',
    url: string,
    body?: Record<string, unknown>,
): Promise<RoomInclusion | null> {
    const token = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)?.[1];

    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    }).catch(() => {
        throw new Error(FAILED);
    });

    if (response.status === 422) {
        const { errors } = (await response.json()) as {
            errors: Record<string, string[]>;
        };

        throw new Error(Object.values(errors)[0]?.[0] ?? FAILED);
    }

    if (!response.ok) {
        throw new Error(
            response.status === 419 || response.status === 401
                ? 'Your session has expired. Reload the page and try again.'
                : FAILED,
        );
    }

    return response.status === 204
        ? null
        : ((await response.json()) as RoomInclusion);
}

export function RoomInclusions({
    roomId,
    inclusions,
}: {
    roomId: number;
    inclusions: RoomInclusion[];
}) {
    const [list, setList] = useState(inclusions);
    const [item, setItem] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [error, setError] = useState<string>();

    // A fresh list from the server (the page was visited again) wins.
    const [source, setSource] = useState(inclusions);

    if (source !== inclusions) {
        setSource(inclusions);
        setList(inclusions);
    }

    // Changes are sent one after another, so quick clicks land in order.
    const queue = useRef<Promise<unknown>>(Promise.resolve());
    const nextTemporaryId = useRef(-1);

    const send = (
        request: () => Promise<RoomInclusion | null>,
        onSaved: (saved: RoomInclusion | null) => void,
        undo: (message: string) => void,
    ) => {
        setError(undefined);
        queue.current = queue.current.then(() =>
            request().then(onSaved, (failure: Error) => {
                undo(failure.message);
                setError(failure.message);
            }),
        );
    };

    const changeQuantity = (inclusion: RoomInclusion, next: number) => {
        const set = (value: number) =>
            setList((current) =>
                current.map((row) =>
                    row.id === inclusion.id ? { ...row, quantity: value } : row,
                ),
            );

        set(next);
        send(
            () =>
                save(
                    'PATCH',
                    RoomInclusionController.update.url({
                        room: roomId,
                        inclusion: inclusion.id,
                    }),
                    { quantity: next },
                ),
            () => {},
            () => set(inclusion.quantity),
        );
    };

    const remove = (inclusion: RoomInclusion) => {
        setList((current) => current.filter((row) => row.id !== inclusion.id));
        send(
            () =>
                save(
                    'DELETE',
                    RoomInclusionController.destroy.url({
                        room: roomId,
                        inclusion: inclusion.id,
                    }),
                ),
            () => {},
            () => setList((current) => sorted([...current, inclusion])),
        );
    };

    const add = (event: FormEvent) => {
        event.preventDefault();

        const name = item.trim();

        if (name === '') {
            return;
        }

        if (list.some((row) => row.item.toLowerCase() === name.toLowerCase())) {
            setError('Already listed. Change its quantity instead.');

            return;
        }

        // Shown at once under a temporary (negative) id until it is saved.
        const temporary = {
            id: nextTemporaryId.current--,
            item: name,
            quantity: Number(quantity),
        };

        setList((current) => sorted([...current, temporary]));
        setItem('');
        setQuantity('1');
        send(
            () =>
                save('POST', RoomInclusionController.store.url(roomId), {
                    item: temporary.item,
                    quantity: temporary.quantity,
                }),
            (saved) =>
                setList((current) =>
                    current.map((row) =>
                        row.id === temporary.id && saved ? saved : row,
                    ),
                ),
            () => {
                setList((current) =>
                    current.filter((row) => row.id !== temporary.id),
                );
                setItem(temporary.item);
                setQuantity(String(temporary.quantity));
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Inclusions</CardTitle>
                <CardDescription>What guests find in the room.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nothing listed yet, e.g. 2 double decks, a fridge,
                        chairs and a table.
                    </p>
                ) : (
                    <ul className="divide-y rounded-lg border">
                        {list.map((inclusion) => {
                            // Still being added: it has no real id to edit yet.
                            const unsaved = inclusion.id < 0;

                            return (
                                <li
                                    key={inclusion.id}
                                    className="flex items-center gap-2 py-1.5 pr-1.5 pl-3"
                                    aria-busy={unsaved}
                                >
                                    <span className="min-w-0 flex-1 truncate text-sm">
                                        {inclusion.item}
                                    </span>
                                    <div className="flex items-center rounded-md border">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7"
                                            aria-label={`One fewer ${inclusion.item}`}
                                            disabled={
                                                inclusion.quantity <= 1 ||
                                                unsaved
                                            }
                                            onClick={() =>
                                                changeQuantity(
                                                    inclusion,
                                                    inclusion.quantity - 1,
                                                )
                                            }
                                        >
                                            <Minus />
                                        </Button>
                                        <span
                                            className="w-7 text-center text-sm font-medium tabular-nums"
                                            aria-label={`Quantity ${inclusion.quantity}`}
                                        >
                                            {inclusion.quantity}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7"
                                            aria-label={`One more ${inclusion.item}`}
                                            disabled={
                                                inclusion.quantity >= 999 ||
                                                unsaved
                                            }
                                            onClick={() =>
                                                changeQuantity(
                                                    inclusion,
                                                    inclusion.quantity + 1,
                                                )
                                            }
                                        >
                                            <Plus />
                                        </Button>
                                    </div>
                                    <IconButton
                                        label={`Remove ${inclusion.item}`}
                                        className="ml-1 text-muted-foreground hover:text-destructive"
                                        disabled={unsaved}
                                        onClick={() => remove(inclusion)}
                                    >
                                        <Trash2 />
                                    </IconButton>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <form onSubmit={add} className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            value={item}
                            onChange={(event) => setItem(event.target.value)}
                            placeholder="Add an item"
                            aria-label="Item"
                            maxLength={150}
                            required
                            className="flex-1"
                        />
                        <Input
                            value={quantity}
                            onChange={(event) =>
                                setQuantity(event.target.value)
                            }
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={999}
                            aria-label="Quantity"
                            className="w-16"
                            required
                        />
                        <Button type="submit" variant="outline">
                            <Plus />
                            Add
                        </Button>
                    </div>
                    <InputError message={error} />
                </form>
            </CardContent>
        </Card>
    );
}
