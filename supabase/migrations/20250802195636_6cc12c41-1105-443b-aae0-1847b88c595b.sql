-- Use the admin function to assign the salesperson role to this user
SELECT admin_update_user_role('cd301924-accd-45c1-aeb5-72f62729effb'::uuid, 'salesperson'::app_role);