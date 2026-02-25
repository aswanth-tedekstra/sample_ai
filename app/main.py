from __future__ import annotations

import os
from typing import List, TypedDict

from fastapi import FastAPI
from pydantic import BaseModel
from langchain_core.messages import AIMessage, HumanMessage, BaseMessage
from langgraph.graph import StateGraph, END
from openai import OpenAI

app = FastAPI(title="FastAPI LangGraph Agent", version="0.1.0")


class ChatState(TypedDict):
    messages: List[BaseMessage]


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


def _messages_to_openai_input(messages: List[BaseMessage]) -> List[dict]:
    converted: List[dict] = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            role = "user"
        elif isinstance(msg, AIMessage):
            role = "assistant"
        else:
            role = "user"
        converted.append({"role": role, "content": str(msg.content)})
    return converted

_openai_client = OpenAI() if os.getenv("OPENAI_API_KEY") else None
_openai_model = os.getenv("OPENAI_MODEL", "gpt-5")


def agent_node(state: ChatState) -> ChatState:
    last = state["messages"][-1]
    if isinstance(last, HumanMessage):
        content = last.content
    else:
        content = str(last.content)

    if _openai_client is None:
        reply = (
            "[dummy-agent] I received: "
            + content
            + " | This is a placeholder response."
        )
        return {"messages": state["messages"] + [AIMessage(content=reply)]}

    response = _openai_client.responses.create(
        model=_openai_model,
        input=_messages_to_openai_input(state["messages"]),
    )
    text = getattr(response, "output_text", None) or ""
    return {"messages": state["messages"] + [AIMessage(content=text)]}


_graph = StateGraph(ChatState)
_graph.add_node("agent", agent_node)
_graph.set_entry_point("agent")
_graph.add_edge("agent", END)
_agent = _graph.compile()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    initial_state: ChatState = {"messages": [HumanMessage(content=req.message)]}
    result = _agent.invoke(initial_state)
    last = result["messages"][-1]
    return ChatResponse(response=str(last.content))
