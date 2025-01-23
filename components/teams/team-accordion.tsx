"use client"

import { type Team } from "@/app/(protected)/teams/page"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { EditTeamDialog } from "./edit-team-dialog"
import { Trash2, UserPlus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TeamAccordionProps {
  teams: Team[]
  onDeleteTeam: (teamId: string) => Promise<void>
  onTeamUpdate: () => Promise<void>
}

export function TeamAccordion({
  teams,
  onDeleteTeam,
  onTeamUpdate,
}: TeamAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {teams.map((team) => (
        <AccordionItem key={team.id} value={team.id}>
          <AccordionTrigger className="group">
            <div className="flex flex-1 items-center justify-between pr-4">
              <div>
                <h3 className="text-base font-semibold">{team.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {team.description}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                <Button variant="ghost" size="sm" asChild>
                  <div className="cursor-pointer">
                    <UserPlus className="h-4 w-4" />
                  </div>
                </Button>
                <EditTeamDialog team={team} onSuccess={onTeamUpdate} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Team</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this team? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteTeam(team.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 px-4 pb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Team Members ({team.team_members?.length || 0})
                </h4>
                <Button variant="outline" size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
              {team.team_members && team.team_members.length > 0 ? (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {team.team_members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted" />
                          <div>
                            <p className="text-sm font-medium">Member Name</p>
                            <p className="text-xs text-muted-foreground">
                              member@email.com
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="rounded-lg border border-dashed p-4">
                  <p className="text-center text-sm text-muted-foreground">
                    No members in this team
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
