# recipe-app

A full stack app using NGINX to host and Node.js for the REST api. 
The entire build can be fired up using Docker-Compose.

The backend is a web crawler (which in this case is pointed at Allrecipes.com) that reads the ingredients off each page and save the recipe/ ingredients to a PostgreSQL database.

In this case, the database is hosted locally but it would be easy (in theory) to host the database elsewhere for scaling purposes (many users could read off the same database and new recipes would be added by the crawler periodically).

The frontend allows the user to search for ingredients in the database and add them to a stock of owned items. (e.g. I have eggs, flour, milk , sugar, and butter)
Then, upon searching, the page will bring up a list of recipes that the user has the required ingredients for as well as links to the original page (for the instructions).

One noteworthy piece I am particularly proud of is in using a trie to speed up searches. While normally a trie is used for things like spell checkers I realized that by structuring the ingredients in such a way it would allow for additions of features like:
- showing recipes where you are only missing one ingredient (for when just need to borrow a cup of sugar)
- by its nature, the search shows recipes where you have more than enough ingredients to make it without adding to the search cost

Planned features:
- keep an internal ratings system or incorporate the host website's (Allrecipes)
- make the frontend look good (the UI works but its not pretty)
- remove duplicate items from the backend 
  - items like 'white sugar' and 'granulated white sugar' can be merged in the backend for ease of use on both the database and client side. I currently have quite a list that are taken care of but I find more every time I run the crawler
