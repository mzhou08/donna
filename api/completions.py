from datetime import datetime
import requests
from langchain_community.llms import OpenAI
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
import dotenv
import os
from typing import List, Tuple

dotenv.load_dotenv()


class NamesOutput(BaseModel):
    names: List[str] = Field(
        list, description="The first names of all the people included in the text."
    )

class BestTimeslotOutput(BaseModel):
    title: str = Field(..., description="The title of the event.")
    start_time: str = Field(
        ..., description="The start time of the timeslot that is most appropriate for the event description."
    )
    end_time: str = Field(
        ..., description="The end time of the timeslot that is most appropriate for the event description."
    )

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
chat_model = ChatOpenAI(
    openai_api_key=OPENAI_API_KEY,
    openai_api_base="https://proxy.tune.app/",
    model_name="mzhou08/mzhou08-gpt-4o-mini",
)

get_names_llm = chat_model.with_structured_output(NamesOutput, method="json_mode")
schedule_event_llm = chat_model.with_structured_output(BestTimeslotOutput, method="json_mode")

def get_names_from_command(command: str):
    return get_names_llm.invoke(
        f"""
Return a list of the first names of all the people included in the following text:
{command}
    """
    )

def get_best_timeslot_from_command(command: str, common_timeslots: List[Tuple[datetime, datetime]]):
    return schedule_event_llm.invoke(
        f"""
Return an appropriate title for the event. Also return
the common timeslot that is most appropriate for the type of event requested.
The title and timeslot will be used to create a Google Calendar event.
The requested event is: {command}
The common timeslots are: {common_timeslots}
    """
    )
