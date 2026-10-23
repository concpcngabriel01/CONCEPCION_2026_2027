# React Pokédex Practical Exam

Instructions and Grading Rubric

## Overview

Create a **React project about a Pokédex** that connects to your **Django project** through an API. Connect both projects following the API standards we practiced in class.

## Requirements

### Pages

1. **Login**
2. **Register**
3. **Gallery**

### Components

1. **Card**
2. **FormPokemon**
3. **GalleryPokemon**

### Features

1. The user can **register and log in via API**.
2. The app implements **CRUD methods for Pokémon** (create, read, update, delete), all done through the API.
3. The **Gallery cannot be accessed** if the user has no login info.

## Instructions

1. Build the React front end and make sure your Django back end exposes the endpoints it needs for users and Pokémon.
2. Connect the two projects via API. Do not hard-code Pokémon data in React; every create, read, update and delete must go through the API.
3. Use the routing, hooks, state handling and API practices we used in class.
4. Make sure both projects run without errors before you submit.
5. Work on your own. Submit your work as directed by your instructor.

## Grading Rubric (100 pts)

| Criteria | Points | Full credit | Partial credit | No credit |
| --- | --- | --- | --- | --- |
| **Register via API** | 8 | New users are created in Django through the API, with clear success and error handling. | Registration works but has no feedback or incomplete validation. | Not working or not connected to the API. |
| **Login via API** | 12 | Login goes through the API, login info is stored and used by the app, and the user is taken to the Gallery. | Login works but login info is not kept or used properly. | Not working or not connected to the API. |
| **Protected Gallery** | 10 | Gallery cannot be accessed without login info, and the user is redirected to Login. | Protection exists but can be bypassed in some cases. | Gallery is open to anyone. |
| **Create Pokémon** | 8 | New Pokémon is saved through the API and appears in the Gallery. | Saves but the Gallery does not update, or validation is missing. | Not working. |
| **Read Pokémon** | 7 | Gallery loads Pokémon from the API and shows them correctly. | Loads but some data is missing or shown incorrectly. | Data is hard-coded or not shown. |
| **Update Pokémon** | 8 | Existing Pokémon is edited through the form and the change is saved through the API. | Updates but the form or Gallery does not reflect the change. | Not working. |
| **Delete Pokémon** | 7 | Pokémon is deleted through the API and removed from the Gallery. | Deletes but the Gallery does not update. | Not working. |
| **Components** (Card, FormPokemon, GalleryPokemon) | 15 | All three components exist, have clear responsibilities, and are reused properly (5 pts each). | One or more components are missing or mix responsibilities. | None of the required components exist. |
| **React and API practices** | 15 | Correct use of hooks, routing and navigation, immutable state updates, and API calls organized as practiced in class. | Mostly correct, with a few misuses. | Practices are not followed. |
| **Code quality and structure** | 5 | Organized files and folders, readable code, meaningful names. | Some disorganization or unclear names. | Disorganized and hard to follow. |
| **UI and usability** | 5 | Pages are clear and usable, with feedback for loading and errors. | Works but is confusing or has no feedback. | Unusable layout. |
| **Total** | **100** |  |  |  |

## Scoring Notes

- A feature is graded as working only if it works **end to end** (React to Django API to database). Features that only work with hard-coded data receive no credit.
- Partial credit is decided by the instructor within the range between full and no credit.
- Missing pages (Login, Register or Gallery) cannot receive credit for the criteria that depend on them.
