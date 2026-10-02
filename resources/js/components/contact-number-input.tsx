import type { ChangeEvent, ComponentProps } from 'react';
import { Input } from '@/components/ui/input';

/**
 * Keeps only what a Philippine mobile number can hold: digits, with an
 * optional leading "+", cut at 11 digits (09XXXXXXXXX) or 12 for the
 * international form (+639XXXXXXXXX).
 */
function clean(value: string): string {
    const plus = value.trimStart().startsWith('+');
    const digits = value.replace(/\D/g, '');
    const international = plus || digits.startsWith('6');

    return (plus ? '+' : '') + digits.slice(0, international ? 12 : 11);
}

/** A phone box that accepts only a Philippine mobile number. */
export default function ContactNumberInput({
    onChange,
    ...props
}: Omit<ComponentProps<'input'>, 'type'>) {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const cleaned = clean(event.target.value);

        if (cleaned !== event.target.value) {
            event.target.value = cleaned;
        }

        onChange?.(event);
    };

    return (
        <Input
            placeholder="09XXXXXXXXX"
            {...props}
            type="tel"
            inputMode="tel"
            pattern="(\+?63|0)[\s\-]?9\d{2}[\s\-]?\d{3}[\s\-]?\d{4}"
            title="Philippine mobile number, such as 09171234567 or +639171234567"
            onChange={handleChange}
        />
    );
}
