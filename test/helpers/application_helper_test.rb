require 'test_helper'

class ApplicationHelperTest < ActionView::TestCase
  test "full title helper" do
    assert_equal full_title,        "Morgan Howell"
    assert_equal full_title("Help"), "Help | Morgan Howell"
  end
end