require 'test_helper'

class StaticPagesControllerTest < ActionController::TestCase

  def setup
    @base_title = "Morgan Howell"
  end

  test "should get home" do
    get :home
    assert_response :success
    assert_select "title", "#{@base_title}" 
  end

  test "should get portfolio" do
    get :portfolio
    assert_response :success
    assert_select "title", "Portfolio | #{@base_title}" 
  end

  test "should get bio" do
  	get :bio
  	assert_response :success
  	assert_select "title", "Bio | #{@base_title}" 
  end

end
