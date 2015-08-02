require 'test_helper'

class StaticPagesControllerTest < ActionController::TestCase
  test "should get home" do
    get :home
    assert_response :success
    assert_select "title", "Home | Morgan Howell" 
  end

  test "should get portfolio" do
    get :portfolio
    assert_response :success
    assert_select "title", "Portfolio | Morgan Howell" 
  end

  test "should get bio" do
  	get :bio
  	assert_response :success
  	assert_select "title", "Bio | Morgan Howell" 
  end

end
