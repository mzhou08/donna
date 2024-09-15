from datetime import datetime
from typing import Tuple
from uagents import Context, Model, Protocol
 
class ScheduleEventRequest(Model):
    free_slot: Tuple[datetime, datetime]
 
class ScheduleEventResponse(Model):
    available: bool

schedule_events_proto = Protocol()

@schedule_events_proto.on_message(model=ScheduleEventRequest, replies={ScheduleEventResponse})
async def handle_book_request(ctx: Context, sender: str, msg: ScheduleEventRequest):
    is_available = False
 
    # check if the event can be scheduled
    for slot in ctx.storage.get("free_slots"):
        if slot[0] <= msg.free_slot[0] and slot[1] >= msg.free_slot[1]:
            is_available = True
            break

    ctx.logger.info(f"Received request for event at {msg.free_slot}. {'I am available.' if is_available else 'I am not available.'}")
    # send the response
    await ctx.send(sender, ScheduleEventResponse(success=is_available))