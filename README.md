# QuakeSafe 
# Software Architecture
![ezgif-7cb973ace77d85](https://github.com/user-attachments/assets/0f9b9d1a-ce4c-43f5-a0e2-a877d811122f)

## Introduction
Per the United States Geological Survey (USGS), nearly 400 earthquakes have occurred in the South Bay Area in the last calendar year alone. Due to its proximity to multiple fault lines, the Bay Area, and particularly San Jose, is at extreme risk for earthquakes year-round. While little can be done to prevent earthquakes, which are natural, unpredictable events, society often falls short of implementing proactive measures to minimize the damage that earthquakes can cause. This is especially true in metropolitan areas like San Jose, where the urban landscape raises the risk of potential property damage and mortality due to earthquakes. This is why we built QuakeSafe, an earthquake preparation and safety app designed for the citizens of San Jose.  
## How It Works
QuakeSafe utilizes cutting-edge AI technology to evaluate places around the city for risks of earthquake damage. Users can take a picture of an area of the city and upload it to the QuakeSafe app, where we will determine how safe the area is in event of an earthquake. By highlighting which areas around the city are safe, QuakeSafe helps direct the city's leaders to improving infrastructure in places where earthquake safety is a legitimate risk.  
Furthermore, we recognized how important it is for people to have their pressing questions answered in event of an earthquake. That is why QuakeSafe comes with an integrated AI assistant, there to answer users' earthquake-related questions before, during, and after an earthquake. We hope that QuakeSafe can help people around San Jose become more prepared and poised in event of an earthquake. 
## The Tech Stack
To build QuakeSafe, we leveraged a great deal of complicated technologies. The app was built using **React Native**, supporting both iOS and Android deployment. The backend was built using **Python** and **FastAPI**, with the image evaluation technology and chatbot integration utilizing **Claude** and **Groq** AI models, respectively. Finally, user authentication and data storage was done using a **PostgreSQL** database via **Supabase**.  
## How To Use QuakeSafe
QuakeSafe is not yet deployed to a mobile app store, so it must be deployed using this repository. 
1. First, clone this repository: `git clone https://github.com/adarshm11/QuakeSafe.git`
2. Open the project in a terminal. Run the backend using the following commands:  
`cd backend`  
`pip install -r requirements.txt` (alternatively, consider using a Python virtual environment)  
`python main.py`  
3. From the root directory, run the frontend using the following commands:   
`cd react-native-app`  
`npm install`  
`npx expo start`  
In the terminal, a QR code will appear.  
Install the **Expo Go** app on your App Store or Google Play Store. Scan the QR code in the terminal using your Camera app (or the Expo Go app on Android devices). Ensure you have an Expo Go account created and verified.  
4. The app is ready to run!
## What's Next For QuakeSafe
We hope to expand QuakeSafe to help other cities besides San Jose, as well as deploying our app to mobile app stores. Additionally, we'd like to introduce a web interface for users to view their city's earthquake safety from outside the app.
