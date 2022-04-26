"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */
/** Show main list of all stories when click site name */
function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}
$body.on("click", "#nav-all", navAllStories);

//show submitted story form on clicking "submit"
function navStorySubmitClick(evt) {
  console.debug("navStorySubmitClick", evt);
  hidePageComponents();
  $allStoriesList.show();
  $submitForm.show();
}
$navStorySubmit.on("click", navStorySubmitClick);

function navFavoritesClick(evt) {
  console.debug("navFavoritesClick", evt);
  hidePageComponents();
  putFavoritesOnPage();
}
$body.on("click", "#nav-my-favorites", navFavoritesClick);

function navMyStories(evt) {
  console.debug("navMyStories", evt);
  hidePageComponents();
  putUsersStoriesOnPage();
  $userStories.show();
}
$body.on("click", "#nav-my-stories", navMyStories);

/** Show login/signup on click on "login" */
function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}
$navLogin.on("click", navLoginClick);

function navProfileClick(evt) {
  console.debug("navProfileClick")
  hidePageComponents();
  $userProfile.show();
}
$navUserProfile.on("click", navProfileClick);
/** When a user first logins in, update the navbar to reflect that. */
function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}