import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AddUserModal from "./CreateUser"; // Assume you have a modal for adding user

interface UsersTableProps {
  users: any[];
  fetchAllUsers: () => void;
  loadingUsers: boolean;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, fetchAllUsers, loadingUsers }) => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  return (
    <Card className="fleet-card-gradient shadow-md border rounded-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAllUsers}>
              <Eye className="h-4 w-4 mr-2" />
              {loadingUsers ? "Loading..." : "View All Users"}
            </Button>
            <Button size="sm" onClick={() => setIsAddUserOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create User
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 text-left">Sr. no.</th>
                <th className="p-2 text-left">Username</th>
                <th className="p-2 text-left">Prize</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{user.username || "—"}</td>
                    <td className="p-2">{user.prize || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-2 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Modal Component */}
      <AddUserModal
        open={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onUserAdded={fetchAllUsers}
      />
    </Card>
  );
};

export default UsersTable;
