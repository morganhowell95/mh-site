require 'test_helper'

class UserTest < ActiveSupport::TestCase

  def setup
    @user = User.new(name:"Morgan Howell", email: "morgan.howell95@gmail.com",
      password: "0514morgann", password_confirmation: "0514morgann")
  end

  test "should be valid" do
    assert @user.valid?
  end

  test "name should be present" do
    @user.name = "    "
    assert_not @user.valid?
  end

  test "email should be present" do
    @user.email = " "
    assert_not @user.valid?
  end

  test "name shouldn't be too long" do
    @user.name = 'a' * 51
    assert_not @user.valid?
  end

  test "email shouldn't be so long" do
    @user.email = 'a' * 254 + '@gmail.com'
    assert_not @user.valid?
  end

  test "should accept valid email addresses" do
    valid_emails = %w[morgan@howll.com GINAHOWELL@windstream.net YO@PO.DO]
    valid_emails.each do |email|
      @user.email = email
      assert @user.valid?, "#{email.inspect} should be valid"
    end
  end

  test "should reject invalid emails" do
    invalid_emails = %w[yo.com hey@flow,com fuckz FUCK@@FUCK.net]
    invalid_emails.each do |email|
      @user.email = email
      assert_not @user.valid?, "#{email.inspect} should not be valid"
    end
  end

  test "user emails shoule be unique" do
    duplicate_user = @user.dup
    duplicate_user.email = @user.email.upcase
    @user.save
    assert_not duplicate_user.valid?
  end

  test "password should be present (nonblank)" do
    @user.password = @user.password_confirmation = " " * 6
    assert_not @user.valid?
  end

  test "email addresses should be saved as lower-case" do
    mixed_case_email = "Foo@ExAMPle.CoM"
    @user.email = mixed_case_email
    @user.save
    assert_equal mixed_case_email.downcase, @user.reload.email
  end

  test "password should have a minimum length" do
    @user.password = @user.password_confirmation = "a" * 5
    assert_not @user.valid?
  end

end
