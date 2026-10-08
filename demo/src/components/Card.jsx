import React, { useState } from "react";

export default function Card({ user, setUsers, users }) {
  const [isUpdate, setUpdate] = useState(false);

  function handleDelete() {
    setUsers(
      users.filter((currentUser) => currentUser.username !== user.username),
    );
  }

  function handleUpdateToggle() {
    setUpdate(!isUpdate);
  }

  function handleInputUpdateChange(e) {
    const { name, value } = e.target;
    const updatedValue = name === "age" && value !== "" ? Number(value) : value;

    const updatedUsers = users.map((currentUser) => {
      if (currentUser.username === user.username) {
        return { ...currentUser, [name]: updatedValue };
      }
      return currentUser;
    });

    setUsers(updatedUsers);
  }

  return (
    <div className="border border-white rounded-md p-4">
      <p>
        Username:{" "}
        {isUpdate ? (
          <input
            name="username"
            value={user.username}
            onChange={handleInputUpdateChange}
            className="border text-white px-1"
          />
        ) : (
          user?.username || "Username"
        )}
      </p>
      <p>
        Age:{" "}
        {isUpdate ? (
          <input
            type="number"
            name="age"
            min={1}
            value={user.age}
            onChange={handleInputUpdateChange}
            className="border text-white px-1"
          />
        ) : (
          user?.age || "Age"
        )}
      </p>

      <button
        onClick={handleUpdateToggle}
        className="bg-green-800 text-white px-2 py-2 mr-2 rounded"
      >
        {isUpdate ? "Done" : "Edit"}
      </button>
      <button
        onClick={handleDelete}
        className="bg-red-800 text-white px-2 py-2 rounded"
      >
        Delete
      </button>
    </div>
  );
}
