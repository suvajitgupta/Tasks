# Tasks/Lebowski login tests
# Author: Mike Ramsey, Suvajit Gupta


describe "Login using bad user name should fail" do

	it "will confirm that an error message is displayed on a failed login attempt" do
	  App['login_panel'].should be_pane_attached
	  App['login_panel.login_err_msg'].should have_value ''
    App['login_panel.user_name_field',TextFieldView].type "InvalidLoginName"
    App['login_panel.password_field'].type "InvalidPassword"
    App['login_panel.login_button'].click
	end

	it "will clear the login and password fields, error message disappears" do
	  puts "... login error = #{App['login_panel.login_err_msg'].value}"
	  App.wait_until(60) do |it| 
	    match = it['login_panel.login_err_msg'].value =~ /Login failed/i 
	    not match.nil?
	  end
	  App['login_panel.user_name_field'].clear
	  App['login_panel.password_field'].clear
	end

end


describe "Add a new user" do

  it "will confirm that there is a Guest Signup button" do
    App['login_panel.guest_signup_button'].should have_title /Guest Signup/i 
  end

  it "will open the Guest Signup panel" do
    App['login_panel.guest_signup_button'].click
    App['signup_panel'].wait_until {|it| it.is_pane_attached}
    App['signup_panel.signup_prompt'].should have_value /Guest Signup/i
  	App['signup_panel.signup_button'].should_not be_enabled
    App['signup_panel.signup_button'].should have_title /Signup/i
    App['signup_panel.cancel_button'].should have_title /Cancel/i
  end

  it "will populate the user information in the Guest Signup panel and Cancel" do
    App['signup_panel.fullNameLabel'].should have_value /Full Name:/i 
    App['signup_panel.fullNameField'].type "#{NEWUSERFULLNAME}"
    App['signup_panel.loginNameLabel'].should have_value /Login Name:/i
    App['signup_panel.loginNameField'].type NEWUSERLOGINNAME
    App['signup_panel.cancel_button'].click
    App['signup_panel'].wait_until {|it| !it.is_pane_attached}
    App['signup_panel'].should_not be_visible_in_window
    App['login_panel'].should be_visible_in_window
  end

  it "will signup as a new user: #{NEWUSERLOGINNAME}" do
    App['login_panel.guest_signup_button'].click
    App['signup_panel'].wait_until {|it| it.is_pane_attached}
    App['signup_panel.fullNameField'].type_keys "#{NEWUSERFULLNAME}"
    App['signup_panel.loginNameField'].type NEWUSERLOGINNAME
    App['signup_panel.signup_button'].click
  end

	it "will confirm that the main pane is visible in window and the login panel is not" do
    App['login_panel'].wait_until {|it| !it.is_pane_attached}
    App['login_panel'].should_not be_pane_attached     
	  App['main_pane'].should be_pane_attached
  end

  it "will confirm the current user logged in has a role of 'Guest'" do
    App['core_tasks'].wait_until { |it| it.object?('currentUser') }
    current_user = App['core_tasks.currentUser']
    current_user.should have_role that_matches(/Guest/i)
  end

end


describe "Log the user out of the application" do

  it "will click on Logout from the Actions menu" do
    App['actions_button'].click
    App.wait_until(60) { |it| it.responding_panes.one?(MenuPane) }
    pane = App.responding_panes.find_first(MenuPane)
    puts "... pane class = #{pane.class}, sc_class = #{pane.sc_class}"
    puts "... pane menu items count = #{pane.menu_items.count}"
  
    pane.menu_items.click /Logout/i
    # pane = App.key_pane(MenuPane)
    # menu_item = pane.menu_items.find_first({ :title => /Logout/i })
    #     menu_item.click
    #     # pane.menu_items.click('Logout')
    #     10.times do
    #       rp = App.responding_panes
    #       rp.each { |p| puts "... responding pane class = #{p.class}, sc_pane = #{p.sc_class}"}
    #       sleep 1
    #     end
    App.wait_until {|it| it.key_pane.kind_of?(AlertPane) }
    pane = App.key_pane AlertPane
    pane.should have_message /Confirmation/i
    pane.should have_description /Are you sure you want to log out from the application\?/i
    pane.click_button 'Yes'
  end

  # it "will confirm that the login panel is visible in the window" do
  #   App.wait_until {|it| !it.key_pane.kind_of?(AlertPane) }
  #   App['login_panel'].wait_until {|it| it.is_pane_attached}
  #   App['login_panel'].should be_visible_in_window
  #   end

end


# describe "Log in to Application as '#{USER_NAME}" do
#   
#   it "will confirm that the login panel is visible in the window" do
#     App['login_panel'].should be_visible_in_window
#   end
#   
#   it "will confirm that there is no currentUser" do
#      App['core_tasks'].wait_until { |it| !it.object?('currentUser') }
#   end
# 
#   it "will log in to the application as '#{USER_NAME}'" do
#       App['login_panel.user_name_field'].type USER_NAME
#     App['login_panel.user_name_field'].type_key 'S'  # USER_NAME
#       App['login_panel.user_name_field'].type_key_append 'A'
#       App['login_panel.user_name_field'].type_key_append :backspace
#       App['login_panel.user_name_field'].type_key_append 'A'
#     App['login_panel.password_field'].type PASSWORD
#     App['login_panel.login_button'].click
#   end
#   
#   it "will confirm the current user logged in has a role of '#{USER_ROLE}'" do
#     App['core_tasks'].wait_until { |it| it.object?('currentUser') }
#     current_user = App['core_tasks.currentUser', :object]
#     current_user.should have_role that_matches(/#{USER_ROLE}/i)
#   end
#   
#   it "will confirm that the main pane is visible in window and the login panel is not" do
#     App['login_panel'].should_not be_visible_in_window
#     App['main_pane'].should be_visible_in_window
#   end
# end