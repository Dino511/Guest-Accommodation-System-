<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomInclusion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * The inclusions card saves in the background (JSON), so the room page is
 * not fetched again after each change. A normal form post still redirects.
 */
class RoomInclusionController extends Controller
{
    public function store(Request $request, Room $room): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'item' => ['required', 'string', 'max:150'],
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $alreadyListed = $room->inclusions->contains(
            fn (RoomInclusion $inclusion) => Str::lower($inclusion->item) === Str::lower(trim($validated['item'])),
        );

        if ($alreadyListed) {
            throw ValidationException::withMessages([
                'item' => __('Already listed. Change its quantity instead.'),
            ]);
        }

        $inclusion = $room->inclusions()->create($validated);

        return $request->wantsJson()
            ? response()->json($inclusion->only(['id', 'item', 'quantity']), 201)
            : to_route('admin.rooms.show', $room);
    }

    public function update(Request $request, Room $room, RoomInclusion $inclusion): RedirectResponse|JsonResponse
    {
        $inclusion->update($request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ]));

        return $request->wantsJson()
            ? response()->json($inclusion->only(['id', 'item', 'quantity']))
            : to_route('admin.rooms.show', $room);
    }

    public function destroy(Request $request, Room $room, RoomInclusion $inclusion): RedirectResponse|JsonResponse
    {
        $inclusion->delete();

        return $request->wantsJson()
            ? response()->json(null, 204)
            : to_route('admin.rooms.show', $room);
    }
}
