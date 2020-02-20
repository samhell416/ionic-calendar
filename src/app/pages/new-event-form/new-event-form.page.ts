import { Component, OnInit, ViewChildren, AfterViewInit, ViewChild } from '@angular/core';
import { ClassModel } from 'src/app/models/event.model';
import { CalendarService } from 'src/app/services/calendar.service';
import { ModalController, Events, ToastController } from '@ionic/angular';
import { ProfessionalModel } from 'src/app/models/professional.model';
import { ModalityModel } from 'src/app/models/modality.model';
import { ModalityContainerService } from 'src/app/services/modality-container.service';
import { ProfessionalContainerService } from 'src/app/services/professional-container.service';
import { IonicSelectableComponent } from 'ionic-selectable';
import { CalendarComponent } from 'ionic2-calendar/calendar';
import { ChangePeriodPage } from '../change-period/change-period.page';

@Component({
  selector: 'app-new-event-form',
  templateUrl: './new-event-form.page.html',
  styleUrls: ['./new-event-form.page.scss'],
})
export class NewEventFormPage implements AfterViewInit {
  @ViewChildren(IonicSelectableComponent) private selectableComponentQuery: any;
  @ViewChild(CalendarComponent, { static: false }) calendarComponent: CalendarComponent;

  public segment: string = 'form';

  public periods = [];
  public time = { currentDate: new Date() };

  public inputTemplate: {
    professional: ProfessionalModel,
    days: Array<boolean>,
    weekRepeat: number,
    duration: number,
    startTime: string,
    classQt: number,
    modality: ModalityModel,
    studentQt: number
  };

  constructor(private calendarService: CalendarService, private modalController: ModalController,
    private modalityContainer: ModalityContainerService, private professionalContainer: ProfessionalContainerService,
    private toastController: ToastController) {
    this.resetInputTemplate();
  }

  ngAfterViewInit() {
    this.selectableComponentQuery._results.forEach((selectableComponent: IonicSelectableComponent) => {
      selectableComponent.searchPlaceholder = "Procurar";
      selectableComponent.closeButtonText = "Cancelar";
      selectableComponent.addButtonText = "Novo";
    });
  }

  async closeModal() {
    await this.modalController.dismiss();
  }

  validateNext() {
    let vMod = this.inputTemplate.modality != null;
    let vProf = this.inputTemplate.professional != null;
    let vDuration = this.inputTemplate.duration > 0;
    let vStudentQt = this.inputTemplate.studentQt > 0;
    if (vProf && vDuration && vMod && vStudentQt)
      return true;
    return false;
  }

  validateTot() {
    let vWeekRepeat = this.inputTemplate.weekRepeat != null;
    let vPeriods = this.periods.length > 0;
    if (vWeekRepeat && vPeriods)
      return true;
    return false;
  }

  resetInputTemplate() {
    this.inputTemplate = {
      professional: null,
      days: new Array<boolean>(false, false, false, false, false, false, false),
      weekRepeat: null,
      duration: null,
      startTime: null,
      classQt: null,
      modality: null,
      studentQt: null
    };
  }

  resetPeriods() {
    this.periods = new Array();
  }

  onEventSelected(ev) {
    this.presentChangeModal(ev);
  }

  onTimeSelected(ev: { events: any, time: Date }) {
    if (ev.events.length == 0) {
      let start = ev.time;
      let end = new Date(start);
      end.setMinutes(start.getMinutes() + this.inputTemplate.duration);
      let period = { startTime: start, endTime: end };
      this.periods.push(period);
      this.calendarComponent.loadEvents();
    }
  }

  private async presentChangeModal(ev) {
    const modal = await this.modalController.create({
      component: ChangePeriodPage,
      componentProps: { ev: ev },
      cssClass: 'custom-modal-css'
    });
    modal.onDidDismiss().then((dataReturned) => {
      if (dataReturned !== null) {
        let i = this.periods.indexOf(dataReturned.data.ev);
        if (dataReturned.data.command == 'update') {
          this.periods[i] = dataReturned.data.ev;
        }
        else if (dataReturned.data.command == 'delete') {
          this.periods.splice(i, 1);
        }
        this.calendarComponent.loadEvents();
      }
    });
    return await modal.present();
  }

  private async presentSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: 'success'
    });
    return toast.present();
  }

  addModality(mod: string) {
    this.modalityContainer.addModality(new ModalityModel(mod));
  }

  addProfessional(pro: string) {
    this.professionalContainer.addProfessional(new ProfessionalModel(pro));
  }

  addEvent() {
    let classes: ClassModel[] = [];
    let today = new Date();

    for (let period of this.periods) {
      for (let repeat = 0; repeat < this.inputTemplate.weekRepeat + 1; repeat ++) {
        let start = new Date();
        start.setTime(period.startTime.getTime());
        start.setDate(start.getDate() + (7 * repeat));
        if (start.getTime() < today.getTime()) {
          continue;
        }
        let end = new Date();
        end.setTime(period.endTime.getTime());
        end.setDate(end.getDate() + (7 * repeat));

        let newClass = new ClassModel(
          this.inputTemplate.professional,
          start, end,
          this.inputTemplate.modality,
          [],
          this.inputTemplate.studentQt
        );
        classes.push(newClass);
      }
    }
    this.calendarService.addClasses(classes);
    this.presentSuccessToast(`${classes.length} novas classes foram adicionadas!`);
    this.closeModal();
  }
}