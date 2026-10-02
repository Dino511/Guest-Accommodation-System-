@php
    $labels = ['created' => 'Added', 'updated' => 'Changed', 'deleted' => 'Deleted'];

    // Same wording as the screen: empty is a dash, booleans are Yes/No.
    $show = function (mixed $value): string {
        if ($value === null || $value === '') {
            return '—';
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        return str_replace('_', ' ', is_scalar($value) ? (string) $value : (string) json_encode($value));
    };

    $field = fn (string $name): string => ucfirst(str_replace('_', ' ', preg_replace('/_id$/', '', $name)));
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Activity log - {{ config('app.name') }}</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; font: 10px/1.45 'DejaVu Sans', sans-serif; color: #111; background: #fff; }
        h1 { margin: 0; font-size: 18px; }
        .meta { margin: 4px 0 0; color: #555; }
        table { width: 100%; margin-top: 16px; border-collapse: collapse; }
        th, td { padding: 6px 8px; border: 1px solid #ccc; text-align: left; vertical-align: top; }
        th { background: #f1f1f1; font-weight: 600; }
        thead { display: table-header-group; }
        tr { break-inside: avoid; }
        .nowrap { white-space: nowrap; }
        .changes { margin: 3px 0 0; color: #444; }
        .note { margin-top: 12px; color: #555; }
        @page { margin: 12mm; }
    </style>
</head>
<body>
    <h1>{{ config('app.name') }}: Activity log</h1>
    <p class="meta">
        Generated {{ now()->format('M j, Y, g:i A') }} by {{ $printedBy }}.
        {{ $entries->count() }} {{ Str::plural('entry', $entries->count()) }}, newest first.
    </p>
    @if ($filters)
        <p class="meta">
            Filters:
            @foreach ($filters as $name => $value)
                {{ $name }}: {{ $value }}@if (! $loop->last); @endif
            @endforeach
        </p>
    @endif


    @if ($entries->isEmpty())
        <p class="note">Nothing matches these filters.</p>
    @else
        <table>
            <thead>
                <tr>
                    <th>When</th>
                    <th>Who</th>
                    <th>Action</th>
                    <th>What</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($entries as $entry)
                    <tr>
                        <td class="nowrap">{{ $entry->created_at->format('M j, Y, g:i A') }}</td>
                        <td>{{ $entry->user?->name ?? 'System' }}</td>
                        <td>{{ $labels[$entry->action] ?? $entry->action }}</td>
                        <td>{{ $types[$entry->subject_type] ?? $entry->subject_type }}</td>
                        <td>
                            {{ $entry->description }}
                            @foreach ($entry->changes ?? [] as $name => [$before, $after])
                                <p class="changes">{{ $field($name) }}: {{ $show($before) }} → {{ $show($after) }}</p>
                            @endforeach
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        @if ($total > $entries->count())
            <p class="note">
                Showing the newest {{ $entries->count() }} of {{ $total }} entries.
                Narrow the date range to get the older ones.
            </p>
        @endif
    @endif

</body>
</html>
