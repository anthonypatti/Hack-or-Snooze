"use strict";
const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";
/******************************************************************************
 * Story: a single story in the system
 */
class Story {
  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */
  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }
  /** Parses hostname out of URL and returns it. */
  getHostName() {
    return new URL(this.url).host;
  }
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */
class StoryList {
  constructor(stories) {
    this.stories = stories;
  }
  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */
  static async getStories() {
    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });
    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));
    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */
  async addStory( user, {title, author, url}) {
    const token = user.loginToken;
    const res = await axios({
      method: "POST",
      url: `${BASE_URL}/stories`,
      data: {token, story: { title, author, url} },
    });
    //new story instance adds to user stories
    const story = new Story(res.data.story);
    this.stories.unshift(story);
    user.ownStories.unshift(story);
    return story;
  }

  async editStory (userToken, {title, author, url, storyId}) {
    // const token = user.loginToken;
    const res = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "PUT",
      data: {userToken, story:{author, title, url}}
    });
    putUsersStoriesOnPage();
  }

  //given the logged in user and a storyId deletes a story and removes it from stories instance of Story
  //as well as users stories and their favorites if applicable

  async removeStory(user, storyId) {
    const token = user.loginToken;
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: {token}
    });
    //filter our whatever story we are remvoing
    this.stories = this.stories.filter(story => story.storyId !== storyId);
    //the same thing but for the user's story list and also their favorites
    user.ownStories = user.ownStories.filter(story => story.storyId !== storyId);
    user.favorites = user.favorites.filter(story => story.storyId !== storyId);
  }
}
/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */
  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;
    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));
    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }
  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */
    //passes information from the signup form to this function to pass to the API
  static async signup(username, password, name) {
    try {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data
    //instantiates a new User in the User class
    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  } catch (err) {
    console.error("signup failed", err.response);
    alert("signup failed, account already exists. Please try another username.");
    return Promise.reject(err);
    }
  }
  /** Login in user with API, make User instance & return it.
   * - username: an existing user's username
   * - password: an existing user's password
   */
  static async login(username, password) {
    try {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });
    let { user } = response.data;
    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  } catch (err) {
    console.error("login failed", err.response);
    alert("invalid username or password, please try again");
    return Promise.reject(err);
    }
  }
  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */
  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });
      let { user } = response.data;
      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  //add a story to the favorites list and update the API. story here is a Story instance
  async addFavoriteStory(story) {
    this.favorites.push(story);
    await this._addOrRemoveFavorites("add", story)
  }

  //Removes a story from the list of user favorites and updates API. Story instance to remove from faves
  async removeFavorite(story) {
    this.favorites = this.favorites.filter(story => story.storyId !== story.storyId);
    await this._addOrRemoveFavorites("remove", story);
  }

  //updates the API with a favorite or removed favorite; new state either add or remove
  //story is  instance of Story to make the favorite or un-favorite

  async _addOrRemoveFavorites(state, story) {
    const method = state === "add" ? "POST" : "DELETE";
    const token = this.loginToken
    await axios ({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: method,
      data: {token}
    });
  }

  //if the story instance is a favorite for the logged in user return true/false based on Id

  isFavorite(story){
    return this.favorites.some(s => (s.storyId === story.storyId));
  }
}