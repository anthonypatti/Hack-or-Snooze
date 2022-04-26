"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */
async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();
  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */
function generateStoryMarkup(story, showDeleteButton = false) {
  const hostName = story.getHostName();
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        ${showDeleteButton ? getEditBtnHTML(): ""}
        ${showStar ? addFavoritesIcon(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

function getEditBtnHTML() {
  return `
      <span class="pencil">
      <i class="fa fa-pencil" aria-hidden="true"></i>
      </span>`;
}
function deleteButton(){
  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "X";
  deleteBtn.classList.add("delete-button");
  return deleteBtn;
}

$userStories.on("click", '.pencil', async function(){
    $('#edit-story-submit').slideToggle();
    //add data attribute to the form node to find the storyID so I can pass into
    //below function
  })
  
  $editForm.on("submit", async function (evt){
      evt.preventDefault();
      let author = $("#edit-story-author").val();
      let title = $("#edit-story-title").val();
      let url = $("#edit-story-url").val();
      const userToken = currentUser.usertoken;
      const $closestParent = $(evt.target).closest("li");
      console.log($closestParent);
      const idOfStory = $closestParent.attr("id");
      console.log("this is storyId", idOfStory);
      const editInfo = {
        title,
        author,
        url,
        storyId: idOfStory
      }
      const story = await storyList.editStory(userToken, editInfo);
      const $story = generateStoryMarkup(story);
      $allStoriesList.prepend($story);
      $('#edit-story-submit').slideToggle().trigger('reset');
      //remove data attribute that was pased in
  });

function addFavoritesIcon(story, user){
  const isFavorited = user.isFavorite(story);
  const faStar = isFavorited ? "fas" : "far";
  return `
    <span class="star">
      <i class="${faStar} fa-star"></i>
    </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");
  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
  $allStoriesList.show();
}

// handles deleting a story
$userStories.on("click", ".delete-button", async function (evt){
  if(window.confirm("Do you really want to delete this story?")) {
    const $closestLi = $(evt.target).closest("li");
    const idOfStory = $closestLi.attr("id");
    await storyList.removeStory(currentUser, idOfStory);
    hidePageComponents();
    await putUsersStoriesOnPage();
  }
});

async function newStorySubmit(evt) {
  console.debug("newStorySubmit");
  evt.preventDefault();
//gets all the information from the new story form submission
  const title = $("#story-title").val();
  const url = $("#story-url").val();
  const author = $("#story-author").val();
  const username = currentUser.username
  const storyData = {title, url, author, username};
  const story = await storyList.addStory(currentUser, storyData);
  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);
//makes the form seem like it disappears and trigger it on form reset
  $submitForm.slideUp("fast");
  $submitForm.trigger("reset");
}
$submitForm.on("submit", newStorySubmit);
//adds the users stories if any to the page
function putUsersStoriesOnPage() {
  console.debug("putUsersStoriesOnPage");
  $userStories.empty();
  if(currentUser.ownStories.length === 0) {
    $userStories.append(`<h3>No stories have been added by ${currentUser.username} yet</h3>`);
  } else {
    for(let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      $story.prepend(deleteButton());
      $userStories.append($story);
      $userStories.append($story);
    }
  }
  $userStories.show();
}

//adding/removing for favorites list and favoriting or unfavorating a story add favorites list to page
function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");
  $favoritedStories.empty();

  if(currentUser.favorites.length === 0) {
    $favoritedStories.append(`<h3>${currentUser.username} has no favorite stories currently</h3>`);
  } else {
    //loop through user's favorite and add to the page
    for(let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }
  $favoritedStories.show();
}

async function toggleFavorites(evt) {
  console.log(evt);
  console.debug("toggleFavorites");
  const $target = $(evt.target);
  const $parentLi = $target.parent().parent();
  const storyid = $parentLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyid)
  //if favorited then remove
  if($target.hasClass("fas")) {
    await currentUser.removeFavorite(story);
    $target.closest("i").toggleClass("fas far");
  } else {
    //not favorited then add it to favorites
    await currentUser.addFavoriteStory(story);
    $target.closest("i").toggleClass("fas far");
  }
}
$storiesLists.on("click", ".star", toggleFavorites);
//  evt.target.parentElement.id