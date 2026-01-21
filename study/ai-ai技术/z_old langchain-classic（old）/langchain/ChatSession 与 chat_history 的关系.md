# ChatSession 与 chat_history 的关系

ChatSession 适合用来为每个用户单独 管理对话上下文，而 chat_history 可以用来存储所有用户的对话历史，以便 全局访问 或 长期保存。

参考一下例子一下子就明白他们的设计初衷了

```py
import uuid
from langchain_core.chat_sessions import ChatSession
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import ChatMessage
from flask import Flask, request, jsonify

app = Flask(__name__)

# 全局字典存储每个用户的 ChatSession
user_sessions = {}

# 存储全局对话历史
global_chat_history = InMemoryChatMessageHistory()

@app.route('/start_chat', methods=['POST'])
def start_chat():
    # 获取用户 ID（可以是用户的 session 或者其他标识符）
    user_id = request.json.get("user_id")
    
    # 为该用户创建新的 ChatSession
    if user_id not in user_sessions:
        user_sessions[user_id] = ChatSession()
    
    # 生成唯一的 session_id
    session_id = str(uuid.uuid4())
    
    return jsonify({"message": "Chat started successfully!", "session_id": session_id})

@app.route('/chat', methods=['POST'])
def chat():
    # 获取用户 ID 和用户输入的消息
    user_id = request.json.get("user_id")
    user_message = request.json.get("message")
    session_id = request.json.get("session_id")
    
    # 确保用户的 ChatSession 存在
    if user_id not in user_sessions:
        return jsonify({"error": "User chat session not found!"}), 400

    # 获取该用户的 ChatSession
    chat_session = user_sessions[user_id]
    
    # 将用户消息添加到该用户的 ChatSession 中
    chat_session.add_message(ChatMessage(role="user", content=user_message, metadata={"session_id": session_id}))
    
    # 在全局历史中存储消息并附加 session_id 和 user_id
    global_chat_history.add_message(ChatMessage(role="user", content=user_message, metadata={"user_id": user_id, "session_id": session_id}))
    
    # 获取对话历史
    chat_history = chat_session.get_messages()
    
    # 模拟 AI 回复（这里我们简单地返回一个固定的回复）
    ai_reply = "This is a mock response from AI."
    
    # 将 AI 回复添加到该用户的 ChatSession 和全局 chat_history 中
    chat_session.add_message(ChatMessage(role="ai", content=ai_reply, metadata={"session_id": session_id}))
    global_chat_history.add_message(ChatMessage(role="ai", content=ai_reply, metadata={"user_id": user_id, "session_id": session_id}))
    
    # 返回 AI 的回复
    return jsonify({"response": ai_reply, "history": [msg.content for msg in chat_history]})

@app.route('/clear_session', methods=['POST'])
def clear_session():
    user_id = request.json.get("user_id")
    session_id = request.json.get("session_id")
    
    # 确保用户的 ChatSession 存在
    if user_id not in user_sessions:
        return jsonify({"error": "User chat session not found!"}), 400
    
    # 获取该用户的 ChatSession
    chat_session = user_sessions[user_id]
    
    # 清空当前会话的消息
    chat_session.clear_messages(session_id=session_id)
    
    return jsonify({"message": f"Session {session_id} cleared!"})

if __name__ == '__main__':
    app.run(debug=True)

```