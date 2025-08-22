"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Job {
  id: string;
  title: string;
  status: string;
}

export default function JobsModule() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/jobs");
      setJobs(res.data);
    } catch (error) {
      console.error("Error fetching jobs", error);
    } finally {
      setLoading(false);
    }
  };

  const addJob = async () => {
    try {
      const res = await axios.post("/api/jobs", { title: newJobTitle });
      setJobs([...jobs, res.data]);
      setNewJobTitle("");
      setIsJobModalOpen(false);
    } catch (error) {
      console.error("Error adding job", error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Jobs</CardTitle>
        <Button size="sm" onClick={() => setIsJobModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading jobs...</p>
        ) : (
          <ul>
            {jobs.map((job) => (
              <li key={job.id} className="py-1 border-b">
                {job.title} - <span className="text-sm">{job.status}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* New Job Modal */}
      <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Job Title</Label>
            <Input
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={addJob}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
