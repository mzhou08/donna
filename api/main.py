from dateutil import parser
import dotenv
from fastapi import FastAPI
import multiprocessing as mp
from pydantic import BaseModel, Field
import requests
from uagents import Agent, Context
import os

from protocol import schedule_events_proto

dotenv.load_dotenv()
app = FastAPI()

import scheduling

class CreateAgentArgs(BaseModel):
    phone: str = Field(..., description="The phone number of the user.")
    name: str = Field(..., description="The name of the user.")
    user_id: str = Field(..., description="The user ID of the user.")

@app.post("/agent")
async def create_agent(args : CreateAgentArgs):
    agent = Agent(name=args.name, seed=f"Xavier-Michael-HackMIT-2024-{args.phone}")
    agent.include(schedule_events_proto)

    @agent.on_event("startup")
    async def introduce_agent(ctx: Context):
        ctx.logger.info(f"Hello, I'm agent {agent.name} and my address is {agent.address}.")

        my_free_slots_response = requests.get(
            f"{os.environ['CONVEX_HTTP_URL']}/user/free-slots",
            params={"id": args.user_id}
        ).json()

        freeSlots = [
            (parser.parse(interval[0]), parser.parse(interval[1]))
            for interval in my_free_slots_response["freeSlots"]
        ]

        ctx.logger.info(f"Stored free slots for {args.name}.")
        ctx.storage.set(
            "free_slots",
            freeSlots
        )

    proc = mp.Process(target = agent.run, args = ())
    proc.start()

    return {"agent_address": agent.address}
