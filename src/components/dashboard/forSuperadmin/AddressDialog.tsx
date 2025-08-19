import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface Organization {
  name: string;
  phone: string;
  email: string;
  gst: string;
  address: string;
}

const AddressDialog: React.FC<{ org: Organization }> = ({ org }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs">
        View
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{org.name}'s Address</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Full Address</h4>
          <p className="mt-1">{org.address}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
          <p className="mt-1">{org.phone}</p>
          <p>{org.email}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">GST Number</h4>
          <p className="mt-1">{org.gst}</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default AddressDialog;
