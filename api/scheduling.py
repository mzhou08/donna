from dateutil import parser
import dotenv
import requests
import os
import time
from uagents import Agent, Context
from pydantic import BaseModel, Field

from completions import get_names_from_command, get_best_timeslot_from_command
from main import app

class ScheduleEventArgs(BaseModel):
    phone: str = Field(..., description="The phone number of the user.")
    name: str = Field(..., description="The name of the user.")
    user_id: str = Field(..., description="The user ID of the user.")
    command: str = Field(..., description="The command from the user.")

dotenv.load_dotenv()

# The interval at which to follow up with the user
FOLLOW_UP_INTERVAL_S = 60 * 60 * 24

def follow_up_with_user(phone: str, name: str):
    while True:
        time.sleep(FOLLOW_UP_INTERVAL_S)

        # check that the user has not responded already
        response = requests.get(
            f"{os.environ['CONVEX_HTTP_URL']}/user/availability",
            params={"phone": phone}
        ).json()
        
        response = requests.post(
            f"{os.environ['CONVEX_HTTP_URL']}/user/availability",
            params={"phone": phone}
        ).json()
        print(f"Following up with {name} at {phone}...")

async def schedule_meeting_with_invitee(
        *,
        my_free_slots,
        my_agent,
        invitee_chat_id,
        invitee_user_id=None,
        invitee_agent_address=None,
    ):

    if invitee_agent_address is None:
        # schedule over text
        response = requests.post(
            f"{os.environ['CONVEX_HTTP_URL']}/user/message",
            params={
                "chatId": invitee_chat_id,
                "message": "Hi, this is Donna. I'd like to schedule a meeting with you. When are you free?"
            }
        ).json()
        invitee_agent_address = response["agentId"]

        # TODO: handle a user text back??

        pass

    # for free_slot in my_free_slots:
        # await ctx.send(invitee_agent_address, Message(message="hello there slaanesh"))

    # return proposed_meeting_time

def schedule_meeting_with_all_invitees(
        *,
        my_free_slots,
        my_agent,
        invitees_data,
    ):

    common_slots = set(my_free_slots)

    for invitee_data in invitees_data:
        invitee_user_id = invitee_data["userId"]

        invitee_free_slots_response = requests.get(
            f"{os.environ['CONVEX_HTTP_URL']}/user/free-slots",
            params={"id": invitee_user_id}
        ).json()

        invitee_free_slots = [
            (parser.parse(interval[0]), parser.parse(interval[1]))
            for interval in invitee_free_slots_response["freeSlots"]
        ]

        new_common_slots = set()

        for slot in common_slots:
            for invitee_slot in invitee_free_slots:
                new_left = max(slot[0], invitee_slot[0])
                new_right = min(slot[1], invitee_slot[1])

                if new_left < new_right:
                    new_common_slots.add((new_left, new_right))
                
        common_slots = new_common_slots

    return common_slots


@app.post("/schedule")
async def handle_user_message(args: ScheduleEventArgs):
    # load the requesting user's agent
    agent = Agent(name=args.name, seed=f"Xavier-Michael-HackMIT-2024-{args.phone}")

    my_free_slots_response = requests.get(
        f"{os.environ['CONVEX_HTTP_URL']}/user/free-slots",
        params={"id": args.user_id}
    )

    print(my_free_slots_response)
    my_free_slots_response = my_free_slots_response.json()

    freeSlots = [
        (parser.parse(interval[0]), parser.parse(interval[1]))
        for interval in my_free_slots_response["freeSlots"]
    ]

    invitees = get_names_from_command(args.command)

    invitees_data = []

    for invitee in invitees:
        invitee_data_response = requests.get(
            f"{os.environ['CONVEX_HTTP_URL']}/user/name",
            params={"name": invitee}
        ).json()

        invitees_data.append(invitee_data_response)

    common_slots = schedule_meeting_with_all_invitees(
        my_free_slots=freeSlots,
        my_agent=agent,
        invitees_data=invitees_data
    )

    best_timeslot_response = get_best_timeslot_from_command(args.command, common_slots)

    return {
        "title": best_timeslot_response.title,
        "start": str(best_timeslot_response.start_time),
        "end": str(best_timeslot_response.end_time),
        "description": "Scheduled by Donna",
        "attendees": [invitee_data["userEmail"] for invitee_data in invitees_data],
    }
